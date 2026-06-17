import cron from "node-cron";
import { LessThan } from "typeorm";
import { DBModle } from "../config/db.connection";
import { TransactionHistory } from "../entity/transactionHistory.entity";
import { PAYMENT_STATUS } from "../enums";

export const startCronJobs = () => {
  // Runs once a day at midnight (00:00)
  cron.schedule("0 0 * * *", async () => {
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
        },
      );

      if (pendingTransactions.length > 0) {
        console.log(
          `Found ${pendingTransactions.length} pending transactions to mark as FAILED.`,
        );

        for (const transaction of pendingTransactions) {
          transaction.paymentStatus = PAYMENT_STATUS.FAILED;
        }

        // Save all updated transactions
        await DBModle.dbInstance.manager.save(
          TransactionHistory,
          pendingTransactions,
        );
        console.log(
          `Successfully marked ${pendingTransactions.length} transactions as FAILED.`,
        );
      } else {
        console.log("No pending orders to clean up.");
      }
    } catch (error) {
      console.error("Error during cron job (cleanup pending orders):", error);
    }
  });
};
