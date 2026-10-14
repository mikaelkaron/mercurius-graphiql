'use strict'

const fs = require('node:fs')
const { basename, join, posix } = require('node:path')
const fp = require('fastify-plugin')
const Static = require('@fastify/static')
const html = require('./lib/html')

const root = join(__dirname, 'static')

function graphiql (app, opts, next) {
  const {
    routePrefix = '/graphiql',
    graphqlPath = '/graphql',
    plugins = []
  } = opts

  if (typeof routePrefix !== 'string' || !routePrefix.startsWith('/') || routePrefix === '/') {
    return next(new TypeError('routePrefix must be a path starting with "/", other than "/"'))
  }

  if (typeof graphqlPath !== 'string' || !graphqlPath.startsWith('/')) {
    return next(new TypeError('graphqlPath must be a path starting with "/"'))
  }

  for (const plugin of plugins) {
    if (!plugin || typeof plugin.name !== 'string' || typeof plugin.umdUrl !== 'string') {
      return next(new TypeError('each GraphiQL plugin needs a name and an umdUrl'))
    }
  }

  if (!fs.existsSync(join(root, 'vendor'))) {
    return next(new Error('GraphiQL assets are missing; run "npm run prepare" in mercurius-graphiql'))
  }

  // config.js and main.js live under the route prefix, so the endpoint is
  // given relative to them and resolved in the browser.
  const config = JSON.stringify({
    endpoint: posix.relative(posix.join(app.prefix, routePrefix), posix.join(app.prefix, graphqlPath)),
    plugins: plugins.map(({ name, props, umdUrl, fetcherWrapper }) => ({ name, props, umdUrl, fetcherWrapper }))
  })

  const page = html(`./${basename(routePrefix)}/`)
  const pageWithSlash = html('./')

  app.get(routePrefix, (req, reply) => {
    reply.type('text/html; charset=utf-8').send(page)
  })

  app.get(`${routePrefix}/`, (req, reply) => {
    reply.type('text/html; charset=utf-8').send(pageWithSlash)
  })

  app.get(`${routePrefix}/config.js`, (req, reply) => {
    reply.type('application/javascript; charset=utf-8').send(`window.GRAPHIQL_CONFIG = ${config}\n`)
  })

  app.register(Static, {
    root,
    prefix: `${routePrefix}/`,
    wildcard: false,
    index: false,
    decorateReply: false
  })

  next()
}

module.exports = fp(graphiql, {
  fastify: '5.x',
  name: 'mercurius-graphiql',
  encapsulate: true
})
module.exports.default = module.exports
module.exports.graphiql = module.exports
