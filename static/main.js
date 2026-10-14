/* global React:false ReactDOM:false GraphiQL:false */
'use strict'

// config.js sits next to this file and sets window.GRAPHIQL_CONFIG:
// the GraphQL endpoint and the GraphiQL plugins, their URLs relative to this file.
const config = window.GRAPHIQL_CONFIG
const base = document.currentScript.src

function loadScript (url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = new URL(url, base).href
    script.crossOrigin = 'anonymous'
    script.addEventListener('load', () => resolve(script), false)
    script.addEventListener('error', reject, false)
    document.body.appendChild(script)
  })
}

function isAsyncIterable (value) {
  return typeof value === 'object' && value !== null && Symbol.asyncIterator in value
}

async function * mapAsyncIterable (iterable, map) {
  for await (const value of iterable) {
    yield map(value)
  }
}

// Passes every result, each event of a subscription too, through the
// fetcherWrapper functions of the GraphiQL plugins.
function fetcherWrapper (fetcher, wrappers) {
  if (wrappers.length === 0) {
    return fetcher
  }

  const wrap = result => wrappers.reduce((acc, wrapper) => wrapper(acc), result)

  return async (params, options) => {
    const result = await fetcher(params, options)
    return isAsyncIterable(result) ? mapAsyncIterable(result, wrap) : wrap(result)
  }
}

function render (plugins) {
  const url = new URL(config.endpoint, base)
  const subscriptionUrl = new URL(url)
  subscriptionUrl.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'

  const fetcherWrapperPlugins = plugins
    .filter(plugin => plugin.fetcherWrapper)
    .map(plugin => window[plugin.name][plugin.fetcherWrapper])

  const fetcher = fetcherWrapper(GraphiQL.createFetcher({
    url: url.href,
    subscriptionUrl: subscriptionUrl.href
  }), fetcherWrapperPlugins)

  ReactDOM.createRoot(document.getElementById('main')).render(
    React.createElement(GraphiQL, {
      fetcher,
      headerEditorEnabled: true,
      shouldPersistHeaders: true,
      plugins: plugins.map(plugin => window[plugin.name].umdPlugin(plugin.props))
    })
  )
}

// A plugin that fails to load is left out, GraphiQL renders without it
Promise.allSettled(config.plugins.map(plugin => loadScript(plugin.umdUrl)))
  .then(results => render(config.plugins.filter((plugin, i) => {
    if (results[i].status === 'rejected') {
      console.error(`GraphiQL plugin ${plugin.name} failed to load from ${plugin.umdUrl}`)
      return false
    }
    return true
  })))
