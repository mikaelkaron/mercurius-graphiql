'use strict'

const { test } = require('node:test')
const fs = require('node:fs')
const Fastify = require('fastify')
const graphiql = require('..')

async function register (opts) {
  const app = Fastify()
  app.register(graphiql, opts)
  try {
    await app.ready()
  } finally {
    await app.close()
  }
}

for (const routePrefix of ['graphiql', '/', '', 1]) {
  test(`rejects routePrefix ${JSON.stringify(routePrefix)}`, async (t) => {
    await t.assert.rejects(register({ routePrefix }), {
      name: 'TypeError',
      message: 'routePrefix must be a path starting with "/", other than "/"'
    })
  })
}

for (const graphqlPath of ['graphql', '', null]) {
  test(`rejects graphqlPath ${JSON.stringify(graphqlPath)}`, async (t) => {
    await t.assert.rejects(register({ graphqlPath }), {
      name: 'TypeError',
      message: 'graphqlPath must be a path starting with "/"'
    })
  })
}

for (const plugin of [null, { umdUrl: '/plugin.js' }, { name: 'plugin' }]) {
  test(`rejects the GraphiQL plugin ${JSON.stringify(plugin)}`, async (t) => {
    await t.assert.rejects(register({ plugins: [plugin] }), {
      name: 'TypeError',
      message: 'each GraphiQL plugin needs a name and an umdUrl'
    })
  })
}

test('fails when the GraphiQL assets were not prepared', async (t) => {
  t.mock.method(fs, 'existsSync', () => false)
  await t.assert.rejects(register({}), {
    message: 'GraphiQL assets are missing; run "npm run prepare" in mercurius-graphiql'
  })
})

test('is a named Fastify plugin with default and named exports', (t) => {
  t.assert.strictEqual(graphiql[Symbol.for('fastify.display-name')], 'mercurius-graphiql')
  t.assert.strictEqual(graphiql.default, graphiql)
  t.assert.strictEqual(graphiql.graphiql, graphiql)
})
