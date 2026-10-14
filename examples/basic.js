'use strict'

const Fastify = require('fastify')
const mercurius = require('mercurius')
const graphiql = require('..')

const app = Fastify({ logger: true })

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
        for (let ticks = 1; ticks <= 5; ticks++) {
          setTimeout(() => pubsub.publish({ topic: 'TICKS', payload: { ticks } }), ticks * 1000)
        }
        return subscription
      }
    }
  }
}

app.register(mercurius, { schema, resolvers, subscription: true })
app.register(graphiql)

app.listen({ port: Number(process.env.PORT ?? 3000) })
