import { redis } from "../config/redis";
import { logger } from "./logger";

/**
 * Publishes a "push this to user X's browser, if they're connected right
 * now" message on Redis — config/socket.ts subscribes to this same
 * channel and relays it to the right socket.io room, as a socket event
 * named `event`. Works identically whether the caller is in this same
 * process (a resolver, the Stripe webhook) or a completely separate one
 * (workers/waitlistWorker.ts) — pub/sub doesn't care.
 *
 * Best-effort: if nobody's connected (or Redis hiccups), whatever the
 * caller already wrote to Postgres is still the source of truth and shows
 * up next time the user opens the app — this only affects *instant*
 * delivery, not durability.
 */
export const pushToUser = async (
  userId: string | number,
  event: string,
  payload: unknown,
) => {
  try {
    await redis.publish(
      "notifications",
      JSON.stringify({ userId: String(userId), event, payload }),
    );
  } catch (error) {
    logger.warn({ err: error, userId, event }, "Failed to push live event");
  }
};

/** A new Notification row exists for this user — the bell should refresh. */
export const pushNotificationToUser = (
  userId: string | number,
  notification: unknown,
) => pushToUser(userId, "notification", notification);

export interface PaymentStatusEvent {
  paymentIntentId: string;
  orderId: string | null;
  paymentStatus: string;
  orderStatus: string | null;
  message: string;
}

/**
 * A payment this user started has reached a final state (confirmed by the
 * Stripe webhook, not by the browser) — the checkout/success page waits on
 * this instead of guessing from the client-side Stripe.js result.
 */
export const pushPaymentStatusToUser = (
  userId: string | number,
  status: PaymentStatusEvent,
) => pushToUser(userId, "payment_status", status);
