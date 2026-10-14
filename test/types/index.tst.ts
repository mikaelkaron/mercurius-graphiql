import { expect } from 'tstyche'
import Fastify from 'fastify'
import graphiql, { graphiql as namedGraphiql, MercuriusGraphiQLOptions } from '../..'

const app = Fastify()

app.register(graphiql)
app.register(namedGraphiql)
app.register(graphiql, {
  routePrefix: '/ide',
  graphqlPath: '/gql',
  plugins: [{ name: 'samplePlugin', props: { size: 1 }, umdUrl: '/samplePlugin.js', fetcherWrapper: 'parseFetchResponse' }]
})

expect<MercuriusGraphiQLOptions>().type.toBeAssignableFrom({})

expect(app.register).type.not.toBeCallableWith(graphiql, { routePrefix: 1 })
expect(app.register).type.not.toBeCallableWith(graphiql, { plugins: [{ name: 'samplePlugin' }] })
