import { GraphQLError } from "graphql";
import { DBModle } from "../../../config/db.connection";
import { TransactionHistory } from "../../../entity/transactionHistory.entity";
import { TransactionInputType } from "../../interfaces/transaction.type";

const transactionRepository = DBModle.dbInstance.getRepository(TransactionHistory);

export const transactionQueries = {
  getTransactionsForOrder: async (_, args: TransactionInputType) => {
    try {
      const transactions = await transactionRepository.find({
        where: {
          order: {
            id: args.orderId,
          },
        },
      });
      return transactions;
    } catch (error) {
      if(error instanceof GraphQLError){
        throw error;
      }
      throw new GraphQLError("Failed to fetch transactions");
    }
  },
};
