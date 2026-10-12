import { Request, Response } from "express";
import Stripe from "stripe";
import { DBModle } from "../config/db.connection";
import { LibraryBook } from "../entity/library_book.entity";
import { Library } from "../entity/library.entity";
import { TransactionHistory } from "../entity/transactionHistory.entity";
import { Order } from "../entity/order.entity";
import { Notification } from "../entity/notification.entity";
import { PAYMENT_STATUS, ORDER_STATUS_ENUM, NOTIFICATION_TYPE } from "../enums";
import {
  PaymentStatusEvent,
  pushNotificationToUser,
  pushPaymentStatusToUser,
} from "../util/notify";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_dummy");
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || "whsec_test_dummy";

/**
 * Tells the user's browser (if connected) about a payment outcome the
 * webhook just recorded: `payment_status` drives the checkout/success
 * page, `notification` refreshes the bell. Sends a small explicit DTO for
 * the notification — the saved entity carries the full `user` relation,
 * password hash included (same reasoning as util/waitlist.ts).
 */
const pushOrderOutcome = (
  userId: string,
  notification: Notification,
  status: PaymentStatusEvent,
) =>
  Promise.all([
    pushPaymentStatusToUser(userId, status),
    pushNotificationToUser(userId, {
      id: notification.id,
      type: notification.type,
      message: notification.message,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
    }),
  ]);

export const stripeWebhookFunction = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"];

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig as string,
      endpointSecret,
    );
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const stripePaymentIntentId = paymentIntent.id;

      // Filled in only once the DB transaction below has committed — the
      // browser must never be told "confirmed" about something that could
      // still roll back.
      let livePush: {
        userId: string;
        notification: Notification;
        status: PaymentStatusEvent;
      } | null = null;

      const queryRunner = DBModle.dbInstance.createQueryRunner();
      await queryRunner.startTransaction();

      try {
        const transaction = await queryRunner.manager.findOne(
          TransactionHistory,
          {
            where: { stripePaymentIntentId },
            relations: [
              "order",
              "order.libraryBook",
              "order.libraryBook.library",
              "order.libraryBook.book",
              "order.user",
            ],
          },
        );

        // Unknown intent, or a duplicate delivery of one already handled —
        // Stripe retries webhooks, so this is expected. `finally` below
        // releases the runner.
        if (!transaction || transaction.paymentStatus === PAYMENT_STATUS.PAID) {
          await queryRunner.rollbackTransaction();
          return res.status(200).json({ status: "ok" });
        }

        transaction.paymentStatus = PAYMENT_STATUS.PAID;
        await queryRunner.manager.save(TransactionHistory, transaction);

        const order = transaction.order;
        const libraryBook = order.libraryBook;
        const selectedLibrary = libraryBook.library;

        // Update LibraryBook quantity
        await queryRunner.manager.update(LibraryBook, libraryBook.id, {
          quantityAvailable: libraryBook.quantityAvailable - 1,
        });

        // Update Library balance
        const amountInRupees = paymentIntent.amount / 100;
        await queryRunner.manager.update(Library, selectedLibrary.id, {
          balance: (selectedLibrary.balance ?? 0) + amountInRupees,
        });

        const message = `Your order for "${
          order.libraryBook?.book?.name ?? "a book"
        }" was confirmed.`;
        const notification = await queryRunner.manager.save(Notification, {
          type: NOTIFICATION_TYPE.ORDER_UPDATE,
          message,
          user: order.user,
          order,
        });

        await queryRunner.commitTransaction();

        livePush = {
          userId: order.user.id,
          notification,
          status: {
            paymentIntentId: stripePaymentIntentId,
            orderId: order.id,
            paymentStatus: PAYMENT_STATUS.PAID,
            orderStatus: order.current_status,
            message,
          },
        };
      } catch (error) {
        await queryRunner.rollbackTransaction();
        console.error("Webhook processing error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
      } finally {
        await queryRunner.release();
      }

      if (livePush) {
        await pushOrderOutcome(livePush.userId, livePush.notification, livePush.status);
      }
      break;
    }
    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const stripePaymentIntentId = paymentIntent.id;

      try {
        const transaction = await DBModle.dbInstance.manager.findOne(
          TransactionHistory,
          {
            where: { stripePaymentIntentId },
            relations: ["order", "order.user"],
          },
        );

        if (transaction && transaction.paymentStatus !== PAYMENT_STATUS.PAID) {
          transaction.paymentStatus = PAYMENT_STATUS.FAILED;
          await DBModle.dbInstance.manager.save(
            TransactionHistory,
            transaction,
          );

          // The order was created optimistically before payment confirmation
          // (see createPaymentIntent) — since payment never went through,
          // it should never sit permanently in Borrowed/Purchased. No
          // inventory rollback is needed: quantity is only ever decremented
          // on the *success* webhook, never at creation time.
          if (
            transaction.order &&
            transaction.order.current_status !== ORDER_STATUS_ENUM.CANCELLED
          ) {
            const message = "Your payment failed and the order was cancelled.";
            await DBModle.dbInstance.manager.update(
              Order,
              transaction.order.id,
              { current_status: ORDER_STATUS_ENUM.CANCELLED },
            );
            const notification = await DBModle.dbInstance.manager.save(
              Notification,
              {
                type: NOTIFICATION_TYPE.ORDER_UPDATE,
                message,
                user: transaction.order.user,
                order: transaction.order,
              },
            );

            await pushOrderOutcome(transaction.order.user.id, notification, {
              paymentIntentId: stripePaymentIntentId,
              orderId: transaction.order.id,
              paymentStatus: PAYMENT_STATUS.FAILED,
              orderStatus: ORDER_STATUS_ENUM.CANCELLED,
              message,
            });
          }
        }
      } catch (error) {
        console.error(
          "Webhook processing error (payment_intent.payment_failed):",
          error,
        );
        return res.status(500).json({ error: "Internal Server Error" });
      }
      break;
    }
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return res.status(200).json({ status: "ok" });
};
