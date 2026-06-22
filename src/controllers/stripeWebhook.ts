import { Request, Response } from "express";
import Stripe from "stripe";
import { DBModle } from "../config/db.connection";
import { LibraryBook } from "../entity/library_book.entity";
import { Library } from "../entity/library.entity";
import { TransactionHistory } from "../entity/transactionHistory.entity";
import { PAYMENT_STATUS } from "../enums";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_dummy");
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || "whsec_test_dummy";

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
              "order.user",
            ],
          },
        );

        if (!transaction || transaction.paymentStatus === PAYMENT_STATUS.PAID) {
          await queryRunner.release();
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

        await queryRunner.commitTransaction();
      } catch (error) {
        await queryRunner.rollbackTransaction();
        console.error("Webhook processing error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
      } finally {
        await queryRunner.release();
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
          },
        );

        if (transaction && transaction.paymentStatus !== PAYMENT_STATUS.PAID) {
          transaction.paymentStatus = PAYMENT_STATUS.FAILED;
          await DBModle.dbInstance.manager.save(
            TransactionHistory,
            transaction,
          );
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
