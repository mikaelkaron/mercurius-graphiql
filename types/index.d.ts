import { FastifyPluginCallback } from 'fastify'

type MercuriusGraphiQL = FastifyPluginCallback<mercuriusGraphiQL.MercuriusGraphiQLOptions>

declare namespace mercuriusGraphiQL {
  export interface GraphiQLPlugin {
    /**
     * The name of the plugin, the same as the global its `umd` build exports
     */
    name: string;
    /**
     * The props to be passed to the plugin
     */
    props?: Record<string, unknown>;
    /**
     * The url of the plugin's `umd` build, loaded by the browser
     */
    umdUrl: string;
    /**
     * A function name exported by the plugin to read/enrich the fetch response
     */
    fetcherWrapper?: string;
  }

  export interface MercuriusGraphiQLOptions {
    /**
     * The path of GraphiQL
     * @default '/graphiql'
     */
    routePrefix?: string;
    /**
     * The path of the GraphQL endpoint, Mercurius' `path` option
     * @default '/graphql'
     */
    graphqlPath?: string;
    /**
     * The GraphiQL plugins to load
     */
    plugins?: GraphiQLPlugin[];
  }

  export const graphiql: MercuriusGraphiQL
  export { graphiql as default }
}

declare function mercuriusGraphiQL (...params: Parameters<MercuriusGraphiQL>): ReturnType<MercuriusGraphiQL>
export = mercuriusGraphiQL
