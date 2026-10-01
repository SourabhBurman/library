import amqp, { ChannelModel, Channel } from "amqplib";
import { logger } from "../util/logger";

/**
 * The one queue this app currently has: restocking a book (a return, an
 * owner topping up copies, new copies added to a library) needs to notify
 * everyone waitlisted for it. Doing that inline, synchronously, inside the
 * mutation that caused the restock means whoever triggers it is stuck
 * waiting on however many Notification rows need to be written — for a
 * popular book with hundreds of waiters, that's a slow, unrelated cost
 * tacked onto a simple "return a book" request.
 *
 * The fix is the standard producer/consumer split: the mutation just
 * *publishes* "check book X's waitlist" and returns immediately; a
 * separate long-running worker process (workers/waitlistWorker.ts)
 * consumes those messages and does the actual (potentially slow) fan-out,
 * on its own time, in its own process.
 */
export const WAITLIST_QUEUE = "waitlist_check";

let channelModel: ChannelModel | null = null;
let channel: Channel | null = null;

/**
 * Lazily connects on first use and caches the connection/channel — called
 * from both the producer side (mutations, via publishWaitlistCheck) and
 * the consumer side (the worker process itself).
 */
export const getChannel = async (): Promise<Channel> => {
  if (channel) return channel;

  channelModel = await amqp.connect(process.env.RABBITMQ_URL || "amqp://localhost:5672");
  channel = await channelModel.createChannel();

  // `durable: true` means the queue definition itself survives a broker
  // restart (it isn't in-memory only) — paired with publishing messages as
  // `persistent: true`, an in-flight "check the waitlist for book X"
  // message survives the broker (or this whole app) crashing and
  // restarting, instead of silently vanishing.
  await channel.assertQueue(WAITLIST_QUEUE, { durable: true });

  channelModel.on("error", (err) => {
    logger.error({ err }, "RabbitMQ connection error");
  });
  channelModel.on("close", () => {
    logger.warn("RabbitMQ connection closed");
    channel = null;
    channelModel = null;
  });

  logger.info("RabbitMQ connected");
  return channel;
};
