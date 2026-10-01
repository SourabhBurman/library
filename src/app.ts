import express from "express";
import "dotenv/config";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import cors from "cors";
import { typeDefs } from "./graphql/typedef";
import { resolvers } from "./graphql/resolvers";
import { DBModle } from "./config/db.connection";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { GraphQLError } from "graphql";
import {
  loginFunction,
  refreshFunction,
} from "./graphql/resolvers/queries/user.queries";
import { signupFunction } from "./graphql/resolvers/mutations/user.mutation";
import { userRepository } from "./config/db.connection";
import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default";
import cookieParser from "cookie-parser";
import { stripeWebhookFunction } from "./controllers/stripeWebhook";
import { startCronJobs } from "./jobs/cronJobs";
import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import pinoHttp, { stdSerializers } from "pino-http";
import { randomUUID } from "crypto";
import { logger } from "./util/logger";
import { graphqlLoggingPlugin } from "./util/graphqlLogging";
import { redis } from "./config/redis";
import { createServer } from "http";
import { initSocket } from "./config/socket";

// Applied only to the auth endpoints below (not globally, so normal
// GraphQL/browsing traffic is unaffected) to blunt brute-force attempts
// against login/signup/refresh.
//
// The store matters as much as the limit itself: express-rate-limit's
// *default* store is a plain in-memory Map living inside this one process.
// That means the counter resets every time nodemon restarts (so a "blocked"
// attacker gets a clean slate on every code change during dev), and if this
// server ever ran as more than one instance behind a load balancer, each
// instance would count independently — 10 instances would let 100 attempts
// through, not 10. Backing it with Redis makes the counter shared and
// durable, which is what a real deployment needs.
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    // rate-limit-redis expects a (...args) => Promise-returning call
    // signature; ioredis's `call` matches that at runtime, but its typings
    // expect a fixed tuple per Redis command rather than a generic
    // string[], hence the `any` cast here.
    sendCommand: (...args: string[]) => (redis.call as any)(...args),
  }),
  message: {
    message: "Too many attempts — please wait a while before trying again.",
    success: false,
  },
});

const PORT = process.env.PORT || 3000;

const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [
    ApolloServerPluginLandingPageLocalDefault({ embed: true }),
    graphqlLoggingPlugin,
  ],
});

const app = express();

// First middleware in the chain, so it wraps the *entire* request lifecycle
// — including the raw-body Stripe webhook route below, which nothing else
// is allowed to run before.
app.use(
  pinoHttp({
    logger,
    // Reuse an incoming X-Request-Id (set by a reverse proxy/load balancer
    // in front of the app, if any) instead of always minting a new one —
    // that's how a single request stays traceable across multiple
    // services in a real deployment. Otherwise generate one.
    genReqId: (req, res) => {
      const existing = req.headers["x-request-id"];
      const id = (Array.isArray(existing) ? existing[0] : existing) || randomUUID();
      res.setHeader("x-request-id", id);
      return id;
    },
    // Quiet down the noisiest, least useful line: don't log health-check
    // style GETs at "info" (nothing to learn from thousands of identical
    // lines) — everything else still logs normally.
    customLogLevel: (_req, res, err) => {
      if (err || res.statusCode >= 500) return "error";
      if (res.statusCode >= 400) return "warn";
      return "info";
    },
    serializers: {
      req: stdSerializers.req,
    },
  }),
);

(async () => {
  try {
    await DBModle.connect();
    startCronJobs();
  } catch (error) {
    // `err` is a recognized pino key — it serializes the Error properly
    // (message + stack trace) instead of printing "[object Object]".
    logger.error({ err: error }, "Error connecting to the database");
  }
  try {
    await server.start();
  } catch (error) {
    logger.error({ err: error }, "Error starting Apollo Server");
  }

  app.post("/webhooks/stripe", express.raw({ type: "application/json" }), stripeWebhookFunction);

  app.use(express.json());
  app.use(
    cors({
      credentials: true,
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
    }),
  );
  app.use(cookieParser());

  app.post("/signup", authRateLimiter, signupFunction);
  app.post("/login", authRateLimiter, loginFunction);
  app.post("/refresh", authRateLimiter, refreshFunction);
  app.post("/logout", async (req: Request, res: Response) => {
    const token = req.cookies?.accessToken;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
          id: string;
        };
        await userRepository.update(decoded.id, {
          refreshTokenHash: null,
          refreshTokenExpiresAt: null,
        });
      } catch {
        // token already invalid/expired — nothing to invalidate server-side
      }
    }
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: true,
    });
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
    });
    res.status(200).send({ message: "Logged out successfully" });
  });

  app.use(
    "/graphql",
    expressMiddleware(server, {
      context: async ({ req, res }: { req: Request; res: Response }) => {
        // pino-http attaches a request-scoped child logger (already tagged
        // with this request's id) to `req.log` — carrying it into the
        // GraphQL context lets graphqlLoggingPlugin (and, if you need it
        // later, resolvers themselves) log with that same correlation id.
        const log = (req as any).log;

        if (
          req.body?.query?.includes("__schema") ||
          req.body?.operationName === "IntrospectionQuery"
        ) {
          return { log };
        }
        let token = req.cookies.accessToken || "";
        // No cookie at all just means an anonymous visitor — let the
        // request through with no user; individual queries/mutations that
        // need auth already guard themselves via requireAuth/requireRole
        // (e.g. getBooks/getLibraries are intentionally public, everything
        // else still rejects an absent/invalid user itself).
        if (!token) {
          return { user: undefined, log };
        }
        try {
          let response = jwt.verify(token, process.env.JWT_SECRET as string);
          return {
            user: response,
            log,
          };
        } catch (error) {
          res.clearCookie("accessToken", {
            httpOnly: true,
            secure: true,
          });
          throw new GraphQLError("Unauthorized: Token expired or invalid", {
            extensions: { code: "UNAUTHENTICATED" },
          });
        }
      },
    }),
  );
})();

// A plain http.Server, not just Express's own implicit one from
// app.listen(...) — Socket.io needs the raw server object so it can
// upgrade a normal HTTP request into a long-lived WebSocket connection
// (Express itself has no concept of that; it only ever handles
// request/response pairs).
const httpServer = createServer(app);
initSocket(httpServer);

httpServer.listen(PORT, () =>
  logger.info({ port: PORT }, `🚀 Server ready at http://localhost:${PORT}/graphql`),
);
