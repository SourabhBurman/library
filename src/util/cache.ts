import { redis } from "../config/redis";
import { logger } from "./logger";

/**
 * "Cache-aside" pattern (the standard one — Redis has no idea a database
 * even exists, the *application* is responsible for keeping the two in
 * sync): on a read, check Redis first; on a miss, fall through to the real
 * source (`load`), store the result with a short expiry, and return it. On
 * write, don't bother updating the cache — just delete the stale key(s) so
 * the next read repopulates them (simpler and less error-prone than trying
 * to keep a cached value patched in place).
 */
export async function getOrSetCache<T>(
  key: string,
  ttlSeconds: number,
  load: () => Promise<T>,
): Promise<T> {
  try {
    const cached = await redis.get(key);
    if (cached !== null) {
      return JSON.parse(cached) as T;
    }
  } catch (error) {
    // A Redis hiccup should degrade to "slower", never to "broken" — fall
    // through to `load()` below exactly as if it had been a cache miss.
    logger.warn({ err: error, key }, "Redis read failed, falling through to source");
  }

  const fresh = await load();

  try {
    await redis.set(key, JSON.stringify(fresh), "EX", ttlSeconds);
  } catch (error) {
    logger.warn({ err: error, key }, "Redis write failed, continuing without caching");
  }

  return fresh;
}

/**
 * Deletes every key under a prefix (e.g. all `books:*` reads) — called from
 * mutations so the next read after a write is guaranteed fresh instead of
 * serving stale cached data until the TTL happens to expire on its own.
 * Uses SCAN (not KEYS) so it doesn't block Redis on a large keyspace.
 */
export async function invalidateCache(prefix: string): Promise<void> {
  try {
    const keysToDelete: string[] = [];
    let cursor = "0";
    do {
      const [nextCursor, keys] = await redis.scan(
        cursor,
        "MATCH",
        `${prefix}*`,
        "COUNT",
        100,
      );
      cursor = nextCursor;
      keysToDelete.push(...keys);
    } while (cursor !== "0");

    if (keysToDelete.length > 0) {
      await redis.del(...keysToDelete);
    }
  } catch (error) {
    // Worst case here is a stale cache entry for up to its TTL — not worth
    // failing the mutation that just successfully wrote to Postgres over.
    logger.warn({ err: error, prefix }, "Cache invalidation failed");
  }
}
