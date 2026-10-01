import "dotenv/config";
import { DBModle } from "../config/db.connection";
import { getChannel, WAITLIST_QUEUE } from "../config/rabbitmq";
import { processWaitlistCheck } from "../util/waitlist";
import { logger } from "../util/logger";

/**
 * A separate, long-running process from the main API server — run it with
 * `npm run worker:waitlist` (its own terminal/process, same as the API
 * server needs its own). This is the actual point of a message queue: the
 * consumer doesn't have to be part of the web server at all, can be
 * scaled independently (run 3 of these if the queue backs up, with zero
 * change to the producer side), and a crash here doesn't take the API
 * down with it.
 */
async function start() {
  await DBModle.connect();
  const channel = await getChannel();

  // Don't hand a consumer more than one message at a time until it acks
  // the current one — without this, a burst of restocks could hand this
  // one worker process dozens of messages at once, all "in progress"
  // concurrently, with no back-pressure.
  await channel.prefetch(1);

  logger.info({ queue: WAITLIST_QUEUE }, "Waitlist worker started, waiting for messages");

  channel.consume(WAITLIST_QUEUE, async (msg) => {
    if (!msg) return;

    try {
      const { bookId } = JSON.parse(msg.content.toString());
      await processWaitlistCheck(bookId);
      // Only ack *after* the work succeeds — this is what makes the queue
      // durable in practice, not just on paper: if this process crashes
      // mid-way through processWaitlistCheck, the message was never acked,
      // so RabbitMQ redelivers it (to this worker on restart, or to
      // another instance) instead of the job silently vanishing.
      channel.ack(msg);
    } catch (error) {
      logger.error({ err: error }, "Failed to process waitlist message");
      // requeue: false — sends it to a dead-letter queue if one's
      // configured, or drops it, rather than immediately retrying forever
      // in a tight loop against a message that's probably going to keep
      // failing the same way (e.g. malformed payload).
      channel.nack(msg, false, false);
    }
  });
}

start().catch((error) => {
  logger.error({ err: error }, "Waitlist worker failed to start");
  process.exit(1);
});
