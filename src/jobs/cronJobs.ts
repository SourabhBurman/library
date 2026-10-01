import cron from "node-cron";
import { Between, IsNull, LessThan, Not } from "typeorm";
import { DBModle } from "../config/db.connection";
import { TransactionHistory } from "../entity/transactionHistory.entity";
import { Order } from "../entity/order.entity";
import { Notification } from "../entity/notification.entity";
import { PAYMENT_STATUS, ORDER_STATUS_ENUM, NOTIFICATION_TYPE } from "../enums";

const DUE_SOON_WINDOW_DAYS = 2;

const cleanupStalePendingOrders = async () => {
  console.log("Running cron job: Cleanup stale pending orders...");
  try {
    // Find orders that are PENDING and older than 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const pendingTransactions = await DBModle.dbInstance.manager.find(
      TransactionHistory,
      {
        where: {
          paymentStatus: PAYMENT_STATUS.PENDING,
          createdAt: LessThan(twentyFourHoursAgo),
        },
        relations: ["order", "order.user"],
      },
    );

    if (pendingTransactions.length === 0) {
      console.log("No pending orders to clean up.");
      return;
    }

    console.log(
      `Found ${pendingTransactions.length} pending transactions to mark as FAILED.`,
    );

    for (const transaction of pendingTransactions) {
      transaction.paymentStatus = PAYMENT_STATUS.FAILED;
    }
    await DBModle.dbInstance.manager.save(
      TransactionHistory,
      pendingTransactions,
    );

    // A transaction that's still PENDING a day later means the order it
    // belongs to was never actually paid for — cancel it instead of leaving
    // it stuck Borrowed/Purchased forever.
    for (const transaction of pendingTransactions) {
      if (
        transaction.order &&
        transaction.order.current_status !== ORDER_STATUS_ENUM.CANCELLED
      ) {
        await DBModle.dbInstance.manager.update(Order, transaction.order.id, {
          current_status: ORDER_STATUS_ENUM.CANCELLED,
        });
        await DBModle.dbInstance.manager.save(Notification, {
          type: NOTIFICATION_TYPE.ORDER_UPDATE,
          message: "Your order was cancelled because payment was never completed.",
          user: transaction.order.user,
          order: transaction.order,
        });
      }
    }

    console.log(
      `Successfully marked ${pendingTransactions.length} transactions as FAILED.`,
    );
  } catch (error) {
    console.error("Error during cron job (cleanup pending orders):", error);
  }
};

// Proactively lets users know about books due soon or already overdue.
// Doesn't touch any money — the actual penalty is still computed at return
// time in returnOrder; this only informs.
const notifyDueAndOverdueBorrows = async () => {
  console.log("Running cron job: Due-soon / overdue borrow notifications...");
  try {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const dueSoonCutoff = new Date(now);
    dueSoonCutoff.setDate(dueSoonCutoff.getDate() + DUE_SOON_WINDOW_DAYS);

    const borrowedOrders = await DBModle.dbInstance.manager.find(Order, {
      where: {
        current_status: ORDER_STATUS_ENUM.BORROWED,
        expectedReturnDate: Not(IsNull()),
      },
      relations: ["user", "libraryBook", "libraryBook.book"],
    });

    for (const order of borrowedOrders) {
      if (!order.expectedReturnDate) continue;
      const bookName = order.libraryBook?.book?.name ?? "your book";

      const isOverdue = order.expectedReturnDate.getTime() < now.getTime();
      const isDueSoon =
        !isOverdue && order.expectedReturnDate.getTime() <= dueSoonCutoff.getTime();

      if (!isOverdue && !isDueSoon) continue;

      const type = isOverdue
        ? NOTIFICATION_TYPE.OVERDUE
        : NOTIFICATION_TYPE.DUE_SOON;

      // Don't spam — skip if we already sent this same notification today.
      const alreadySentToday = await DBModle.dbInstance.manager.findOne(
        Notification,
        {
          where: {
            order: { id: order.id },
            type,
            createdAt: Between(startOfToday, now),
          },
        },
      );
      if (alreadySentToday) continue;

      await DBModle.dbInstance.manager.save(Notification, {
        type,
        message: isOverdue
          ? `"${bookName}" is overdue — return it soon to avoid a growing penalty.`
          : `"${bookName}" is due back soon (by ${order.expectedReturnDate.toDateString()}).`,
        user: order.user,
        order,
      });
    }
  } catch (error) {
    console.error(
      "Error during cron job (due/overdue notifications):",
      error,
    );
  }
};

export const startCronJobs = () => {
  // Runs once a day at midnight (00:00)
  cron.schedule("0 0 * * *", cleanupStalePendingOrders);
  cron.schedule("0 0 * * *", notifyDueAndOverdueBorrows);
};

// Exported for direct invocation (manual testing / verification) without
// waiting for the schedule to fire.
export const __cronJobsForTesting = {
  cleanupStalePendingOrders,
  notifyDueAndOverdueBorrows,
};
