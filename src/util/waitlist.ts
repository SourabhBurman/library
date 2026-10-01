import { MoreThan } from "typeorm";
import {
  libraryBookRepository,
  waitlistRepository,
  notificationRepository,
} from "../config/db.connection";
import { NOTIFICATION_TYPE } from "../enums";
import { getChannel, WAITLIST_QUEUE } from "../config/rabbitmq";
import { pushNotificationToUser } from "./notify";
import { logger } from "./logger";

/**
 * Producer side: called from the mutations that might have moved a book's
 * stock from 0 to positive (returnOrder, updateLibraryBook,
 * addBookToLibrary). Publishes a small "go check this book's waitlist"
 * message and returns immediately — the actual work (querying waiters,
 * writing N notification rows, clearing the waitlist) happens later, out
 * of band, in workers/waitlistWorker.ts. Best-effort: a broker hiccup
 * should never fail the mutation that already succeeded in Postgres.
 */
export const publishWaitlistCheck = async (bookId: string) => {
  try {
    const channel = await getChannel();
    channel.sendToQueue(WAITLIST_QUEUE, Buffer.from(JSON.stringify({ bookId })), {
      // Tells the broker to persist the message to disk, not just hold it
      // in memory — matches `durable: true` on the queue itself. Without
      // both, a broker restart would lose in-flight messages.
      persistent: true,
    });
  } catch (error) {
    logger.error({ err: error, bookId }, "Failed to publish waitlist check");
  }
};

/**
 * Consumer-side logic: the actual DB work, run by the worker process for
 * every message it receives. Kept separate from the queue-handling
 * boilerplate in workers/waitlistWorker.ts so it's plain, testable
 * business logic with no AMQP concepts in it.
 */
export const processWaitlistCheck = async (bookId: string) => {
  const hasStock = await libraryBookRepository.exist({
    where: { book: { id: bookId }, quantityAvailable: MoreThan(0) },
  });
  if (!hasStock) return;

  const waiters = await waitlistRepository.find({
    where: { book: { id: bookId } },
    relations: ["user", "book"],
  });
  if (waiters.length === 0) return;

  const savedNotifications = await notificationRepository.save(
    waiters.map((w) => ({
      type: NOTIFICATION_TYPE.GENERAL,
      message: `"${w.book.name}" is back in stock — grab it before it's gone again!`,
      user: w.user,
      order: null,
    })),
  );

  // Push each one live to whoever's currently connected — see
  // util/notify.ts. The row in Postgres above is the source of truth
  // (it's what a fresh page load fetches); this is purely "make it show
  // up instantly if they're already looking at the app right now".
  //
  // Deliberately send a small explicit DTO, NOT the saved entity as-is:
  // `notificationRepository.save()` echoes back whatever relations were
  // attached going in, and `user` here is the *full* User row — bcrypt
  // hash and all. That's fine sitting in Postgres or crossing an
  // authenticated GraphQL resolver that already knows to strip it before
  // returning, but this path skips GraphQL entirely (it's a raw
  // Redis-pub/sub -> socket.io hop), so nothing else was going to strip it.
  await Promise.all(
    savedNotifications.map((n, i) =>
      pushNotificationToUser(waiters[i].user.id, {
        id: n.id,
        type: n.type,
        message: n.message,
        isRead: n.isRead,
        createdAt: n.createdAt,
      }),
    ),
  );

  await waitlistRepository.remove(waiters);
  logger.info({ bookId, notified: waiters.length }, "Waitlist notifications sent");
};
