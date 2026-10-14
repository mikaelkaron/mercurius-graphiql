# mercurius-graphiql

[GraphiQL](https://github.com/graphql/graphiql) for [Mercurius](https://mercurius.dev), served from the package itself.

The GraphiQL built into Mercurius loads React, ReactDOM and GraphiQL from unpkg, so it needs a connection to the internet. This plugin ships those files and serves them from your Fastify app, so GraphiQL works offline and on a private network. The page has no inline scripts or styles, so a Content Security Policy of `default-src 'self'; font-src 'self' data:; img-src 'self' data:` is enough: GraphiQL embeds its fonts and icons as `data:` URLs.

## Install

```bash
npm i mercurius-graphiql
```

## Usage

Register the plugin next to Mercurius, in the same context:

```js
const Fastify = require('fastify')
const mercurius = require('mercurius')
const graphiql = require('mercurius-graphiql')

const app = Fastify()

app.register(mercurius, {
  schema: 'type Query { add(x: Int, y: Int): Int }',
  resolvers: { Query: { add: async (_, { x, y }) => x + y } },
  subscription: true
})
app.register(graphiql)

app.listen({ port: 3000 })
```

GraphiQL is now at http://localhost:3000/graphiql.

Leave the `graphiql` option of Mercurius off: both serve `/graphiql`.

## Options

- `routePrefix`: string, default `'/graphiql'`. The path of GraphiQL. Its files are served under it, such as `/graphiql/main.js`.
- `graphqlPath`: string, default `'/graphql'`. The path of the GraphQL endpoint, the same as Mercurius' `path` option.
- `plugins`: Array. [GraphiQL plugins](https://github.com/mercurius-js/mercurius/tree/master/examples/graphiql-plugin) in a `umd` build:
  - `name`: string. The name of the plugin, the same as the global its `umd` build exports.
  - `props`: Object | undefined. The props to be passed to the plugin.
  - `umdUrl`: string. The URL of the plugin's `umd` build. A relative URL is resolved from the files of GraphiQL, such as `/graphiql/main.js`.
  - `fetcherWrapper`: string | undefined. A function name exported by the plugin to read/enrich each result, every event of a subscription too.

Both paths follow the prefix of the context they are registered in, so GraphiQL finds an endpoint registered under the same prefix:

```js
app.register(async (app) => {
  app.register(mercurius, { schema, resolvers, path: '/gql' })
  app.register(graphiql, { graphqlPath: '/gql' })
}, { prefix: '/api' })
// GraphiQL at /api/graphiql, querying /api/gql
```

The page refers to its files and to the endpoint by relative URLs, so it keeps working behind a proxy that serves the app under another path.

## Versions

| mercurius-graphiql | GraphiQL | React  |
| ------------------ | -------- | ------ |
| 1.x                | 3.8.3    | 18.3.1 |

## Development

`npm install` runs `npm run prepare`, which copies the GraphiQL, React and ReactDOM builds from their packages into `static/vendor`. `npm test` runs it too.

`npm run test:e2e` runs GraphiQL in Chromium with every request to another origin blocked. Install the browser first with `npx playwright install chromium`.

## License

MIT
