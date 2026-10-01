import Redis from "ioredis";
import { logger } from "../util/logger";

/**
 * One shared Redis connection for the whole app. Two very different things
 * end up using it:
 *  - rate-limit-redis (app.ts): a shared counter for login/signup attempts,
 *    so the limit is per-account-across-restarts, not per-process-in-memory.
 *  - Query caching (book/library resolvers): short-TTL cached GraphQL reads
 *    for data that's read far more often than it changes.
 *
 * ioredis (not the "redis" package) is used because it has built-in
 * reconnect/retry handling out of the box, which is what you want for a
 * long-lived connection like this one.
 */
export const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  // Without this, ioredis's default retry strategy keeps trying forever
  // and *queues up* every command issued while disconnected instead of
  // failing them — great for hiding a real outage, bad for anything that
  // needs to know caching/rate-limiting is currently unavailable.
  maxRetriesPerRequest: 3,
});

redis.on("error", (err) => {
  logger.error({ err }, "Redis connection error");
});

redis.on("connect", () => {
  logger.info("Redis connected");
});
