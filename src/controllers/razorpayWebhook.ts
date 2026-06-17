import { Request, Response } from "express";
import crypto from "crypto";
import { DBModle } from "../config/db.connection";
import { Order } from "../entity/order.entity";
import { LibraryBook } from "../entity/library_book.entity";
import { User } from "../entity/user.entity";
import { Library } from "../entity/library.entity";
import { TransactionHistory } from "../entity/transactionHistory.entity";
import { TRANSACTION_TYPE, PAYMENT_STATUS, ORDER_STATUS_ENUM } from "../enums";

export const razorpayWebhookFunction = async (req: Request, res: Response) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "dummy_webhook_secret";

  const shasum = crypto.createHmac("sha256", secret);
  shasum.update(JSON.stringify(req.body));
  const digest = shasum.digest("hex");

  if (digest !== req.headers["x-razorpay-signature"]) {
    return res.status(400).json({ error: "Invalid signature" });
  }

  const event = req.body.event;

  if (event === "payment.captured") {
    const payment = req.body.payload.payment.entity;
    const razorpayOrderId = payment.order_id;
    const razorpayPaymentId = payment.id;

    const queryRunner = DBModle.dbInstance.createQueryRunner();
    await queryRunner.startTransaction();

    try {
      const transaction = await queryRunner.manager.findOne(TransactionHistory, {
        where: { razorpayOrderId },
        relations: ["order", "order.libraryBook", "order.libraryBook.library", "order.user"],
      });

      if (!transaction || transaction.paymentStatus === PAYMENT_STATUS.PAID) {
        await queryRunner.release();
        return res.status(200).json({ status: "ok" });
      }

      transaction.paymentStatus = PAYMENT_STATUS.PAID;
      transaction.razorpayPaymentId = razorpayPaymentId;
      await queryRunner.manager.save(TransactionHistory, transaction);

      const order = transaction.order;
      const libraryBook = order.libraryBook;
      const selectedLibrary = libraryBook.library;

      // Update LibraryBook quantity
      await queryRunner.manager.update(LibraryBook, libraryBook.id, {
        quantityAvailable: libraryBook.quantityAvailable - 1,
      });

      // Update Library balance
      const amountInRupees = payment.amount / 100;
      await queryRunner.manager.update(Library, selectedLibrary.id, {
        balance: (selectedLibrary.balance ?? 0) + amountInRupees,
      });

      await queryRunner.commitTransaction();
      return res.status(200).json({ status: "ok" });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error("Webhook processing error:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    } finally {
      await queryRunner.release();
    }
  }
  if (event === "payment.failed") {
    const payment = req.body.payload.payment.entity;
    const razorpayOrderId = payment.order_id;

    try {
      const transaction = await DBModle.dbInstance.manager.findOne(TransactionHistory, {
        where: { razorpayOrderId },
      });

      if (transaction && transaction.paymentStatus !== PAYMENT_STATUS.PAID) {
        transaction.paymentStatus = PAYMENT_STATUS.FAILED;
        // Optionally save the failed payment ID if you want to track it
        transaction.razorpayPaymentId = payment.id;
        await DBModle.dbInstance.manager.save(TransactionHistory, transaction);
      }
      return res.status(200).json({ status: "ok" });
    } catch (error) {
      console.error("Webhook processing error (payment.failed):", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  return res.status(200).json({ status: "ignored" });
};
