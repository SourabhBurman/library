import { ApolloServerPlugin } from "@apollo/server";
import { logger } from "./logger";

/**
 * A generic HTTP request logger only ever sees "POST /graphql" — every
 * query and mutation hits the same route, so the interesting part (*which*
 * operation ran, how long it took, whether it errored) is invisible to it.
 * This Apollo plugin logs that GraphQL-specific detail instead, using the
 * same per-request logger pino-http attached to `context.log` (see
 * app.ts), so these lines share a request id with the HTTP access log line
 * for the same request.
 */
export const graphqlLoggingPlugin: ApolloServerPlugin = {
  async requestDidStart() {
    const startedAt = Date.now();

    return {
      async willSendResponse(requestContext) {
        const log = (requestContext.contextValue as any)?.log ?? logger;
        const operationName =
          requestContext.request.operationName ||
          requestContext.operationName ||
          "anonymous";
        const durationMs = Date.now() - startedAt;
        const errors = requestContext.errors;

        if (errors?.length) {
          log.warn(
            {
              operationName,
              durationMs,
              errors: errors.map((e) => ({
                message: e.message,
                code: e.extensions?.code,
              })),
            },
            "GraphQL operation completed with errors",
          );
        } else {
          log.info({ operationName, durationMs }, "GraphQL operation completed");
        }
      },
    };
  },
};
