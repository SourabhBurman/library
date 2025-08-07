import { GraphQLError } from "graphql";
import { DBModle } from "../../../config/db.connection";
import { Transaction } from "../../../entity/transaction.entity";

const transactionRepository = DBModle.dbInstance.getRepository(Transaction);

export const transactionQueries = {
  getTransactions: async () => {
    try {
      const transactions = await transactionRepository.find();
      return transactions;
    } catch (error) {
      console.error("Error fetching transactions:", error);
      throw new GraphQLError("Failed to fetch transactions");
    }
  },

  getTransaction: async (_, args: { id: string }) => {
    const { id } = args;
    try {
      const transaction = await transactionRepository.findOne({
        where: { id },
      });
      if (!transaction) {
        throw new GraphQLError(`Transaction with ID ${id} not found`);
      }
      return transaction;
    } catch (error) {
      console.error("Error fetching transaction:", error);
      throw new GraphQLError("Failed to fetch transaction");
    }
  },
};
