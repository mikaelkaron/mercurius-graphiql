'use strict'

const Fastify = require('fastify')
const mercurius = require('mercurius')
const graphiql = require('..')

// A GraphiQL plugin in a umd build: a sidebar panel, and a fetcherWrapper
// that counts the results it sees.
const plugin = `
window.countingPlugin = {
  umdPlugin: function (props) {
    return {
      title: props.title,
      icon: function () { return window.React.createElement('span', null, '#') },
      content: function () { return window.React.createElement('p', null, props.title) }
    }
  },
  count: function (result) {
    window.countingPlugin.counted = (window.countingPlugin.counted || 0) + 1
    return Object.assign({}, result, { extensions: { counted: window.countingPlugin.counted } })
  }
}
`

const schema = `
  type Query {
    add(x: Int, y: Int): Int
  }

  type Subscription {
    ticks: Int
  }
`

const resolvers = {
  Query: {
    add: async (_, { x, y }) => x + y
  },
  Subscription: {
    ticks: {
      subscribe: async (root, args, { pubsub }) => {
        const subscription = await pubsub.subscribe('TICKS')
        for (let ticks = 1; ticks <= 3; ticks++) {
          setTimeout(() => pubsub.publish({ topic: 'TICKS', payload: { ticks } }), ticks * 200)
        }
        return subscription
      }
    }
  }
}

const app = Fastify()

app.register(async (app) => {
  app.register(mercurius, { schema, resolvers, subscription: true })
  app.register(graphiql, {
    plugins: [{
      name: 'countingPlugin',
      props: { title: 'Counting' },
      umdUrl: '../plugin.js',
      fetcherWrapper: 'count'
    }]
  })
  app.get('/plugin.js', (req, reply) => {
    reply.type('application/javascript').send(plugin)
  })
}, { prefix: '/api' })

app.listen({ port: Number(process.env.PORT), host: '127.0.0.1' })
