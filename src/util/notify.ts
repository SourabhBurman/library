import { redis } from "../config/redis";
import { logger } from "./logger";

/**
 * Publishes a "push this to user X's browser, if they're connected right
 * now" message on Redis — config/socket.ts subscribes to this same
 * channel and relays it to the right socket.io room. Works identically
 * whether the caller is in this same process (a resolver) or a completely
 * separate one (workers/waitlistWorker.ts) — pub/sub doesn't care.
 *
 * Best-effort: if nobody's connected (or Redis hiccups), the notification
 * still exists as a normal row in Postgres and shows up next time the
 * user opens the app — this only affects *instant* delivery, not
 * durability.
 */
export const pushNotificationToUser = async (
  userId: string | number,
  notification: unknown,
) => {
  try {
    await redis.publish(
      "notifications",
      JSON.stringify({ userId: String(userId), notification }),
    );
  } catch (error) {
    logger.warn({ err: error, userId }, "Failed to push live notification");
  }
};
