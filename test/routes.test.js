'use strict'

const { test } = require('node:test')
const { readFileSync } = require('node:fs')
const { join } = require('node:path')
const Fastify = require('fastify')
const mercurius = require('mercurius')
const graphiql = require('..')

const schema = 'type Query { add(x: Int, y: Int): Int }'
const resolvers = { Query: { add: (_, { x, y }) => x + y } }

function config (body) {
  const window = {}
  // eslint-disable-next-line no-new-func
  new Function('window', body)(window)
  return window.GRAPHIQL_CONFIG
}

test('serves the page at /graphiql, with files relative to it', async (t) => {
  const app = Fastify()
  app.register(mercurius, { schema, resolvers })
  app.register(graphiql)
  t.after(() => app.close())

  const res = await app.inject('/graphiql')
  t.assert.strictEqual(res.statusCode, 200)
  t.assert.strictEqual(res.headers['content-type'], 'text/html; charset=utf-8')
  t.assert.ok(res.body.includes('<link rel="stylesheet" href="./graphiql/vendor/graphiql.min.css"/>'))
  t.assert.ok(res.body.includes('<link rel="stylesheet" href="./graphiql/graphiql.css"/>'))
  const scripts = [...res.body.matchAll(/<script src="([^"]+)"><\/script>/g)].map(([, src]) => src)
  t.assert.deepStrictEqual(scripts, [
    './graphiql/vendor/react.production.min.js',
    './graphiql/vendor/react-dom.production.min.js',
    './graphiql/vendor/graphiql.min.js',
    './graphiql/config.js',
    './graphiql/main.js'
  ])
})

test('serves the page at /graphiql/, with files relative to it', async (t) => {
  const app = Fastify()
  app.register(graphiql)
  t.after(() => app.close())

  const res = await app.inject('/graphiql/')
  t.assert.strictEqual(res.statusCode, 200)
  t.assert.ok(res.body.includes('<script src="./vendor/graphiql.min.js"></script>'))
  t.assert.ok(res.body.includes('<script src="./main.js"></script>'))
})

test('loads nothing from another origin', async (t) => {
  const app = Fastify()
  app.register(graphiql)
  t.after(() => app.close())

  const res = await app.inject('/graphiql')
  t.assert.ok(!/(?:src|href)="(?:https?:)?\/\//.test(res.body))
})

test('serves every file the page references', async (t) => {
  const app = Fastify()
  app.register(graphiql)
  t.after(() => app.close())

  const page = await app.inject('/graphiql/')
  const files = [...page.body.matchAll(/(?:src|href)="\.\/([^"]+)"/g)].map(([, file]) => file)
  t.assert.strictEqual(files.length, 7)

  for (const file of files) {
    const res = await app.inject(`/graphiql/${file}`)
    t.assert.strictEqual(res.statusCode, 200, file)
    t.assert.match(res.headers['content-type'], file.endsWith('.css') ? /^text\/css/ : /^application\/javascript/, file)
  }

  const main = await app.inject('/graphiql/main.js')
  t.assert.strictEqual(main.body, readFileSync(join(__dirname, '../static/main.js'), 'utf8'))
})

test('drops the source map references of the copied files', async (t) => {
  const app = Fastify()
  app.register(graphiql)
  t.after(() => app.close())

  for (const file of ['graphiql.min.js', 'graphiql.min.css']) {
    const res = await app.inject(`/graphiql/vendor/${file}`)
    t.assert.ok(!res.body.includes('sourceMappingURL'), file)
  }
})

test('config.js gives the endpoint relative to the route prefix', async (t) => {
  const app = Fastify()
  app.register(graphiql)
  t.after(() => app.close())

  const res = await app.inject('/graphiql/config.js')
  t.assert.strictEqual(res.statusCode, 200)
  t.assert.strictEqual(res.headers['content-type'], 'application/javascript; charset=utf-8')
  t.assert.deepStrictEqual(config(res.body), { endpoint: '../graphql', plugins: [] })
})

test('config.js follows the prefix, the route prefix and the GraphQL path', async (t) => {
  const app = Fastify()
  app.register(async (app) => {
    app.register(mercurius, { schema, resolvers, path: '/gql' })
    app.register(graphiql, { routePrefix: '/tools/ide', graphqlPath: '/gql' })
  }, { prefix: '/api' })
  t.after(() => app.close())

  const page = await app.inject('/api/tools/ide')
  t.assert.ok(page.body.includes('<script src="./ide/main.js"></script>'))

  const res = await app.inject('/api/tools/ide/config.js')
  const { endpoint } = config(res.body)
  t.assert.strictEqual(endpoint, '../../gql')
  t.assert.strictEqual(new URL(endpoint, 'http://localhost/api/tools/ide/main.js').pathname, '/api/gql')

  const query = await app.inject({ method: 'POST', url: '/api/gql', body: { query: '{ add(x: 2, y: 2) }' } })
  t.assert.deepStrictEqual(query.json(), { data: { add: 4 } })
})

test('config.js follows the prefix of the plugin', async (t) => {
  const app = Fastify()
  app.register(graphiql, { prefix: '/api' })
  t.after(() => app.close())

  const res = await app.inject('/api/graphiql/config.js')
  t.assert.strictEqual(new URL(config(res.body).endpoint, 'http://localhost/api/graphiql/main.js').pathname, '/api/graphql')
})

test('config.js lists the GraphiQL plugins', async (t) => {
  const app = Fastify()
  const plugins = [
    { name: 'samplePlugin', props: { a: 1 }, umdUrl: '/samplePlugin.js', fetcherWrapper: 'parseFetchResponse', other: true },
    { name: 'otherPlugin', umdUrl: 'http://localhost/otherPlugin.js' }
  ]
  app.register(graphiql, { plugins })
  t.after(() => app.close())

  const res = await app.inject('/graphiql/config.js')
  t.assert.deepStrictEqual(config(res.body).plugins, [
    { name: 'samplePlugin', props: { a: 1 }, umdUrl: '/samplePlugin.js', fetcherWrapper: 'parseFetchResponse' },
    { name: 'otherPlugin', umdUrl: 'http://localhost/otherPlugin.js' }
  ])
})

test('can be used next to @fastify/static', async (t) => {
  const app = Fastify()
  app.register(require('@fastify/static'), { root: __dirname, prefix: '/files/' })
  app.register(graphiql)
  t.after(() => app.close())

  t.assert.strictEqual((await app.inject('/graphiql/main.js')).statusCode, 200)
  t.assert.strictEqual((await app.inject('/files/routes.test.js')).statusCode, 200)
})
