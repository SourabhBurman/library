import { GraphQLError } from "graphql";
import { DBModle } from "../../../config/db.connection";
import { Transaction } from "../../../entity/transaction.entity";
import { TRANSACTION_TYPE } from "../../../enums";
import { Book } from "../../../entity/books.entity";
import { User } from "../../../entity/user.entity";

const transactionRepository = DBModle.dbInstance.getRepository(Transaction);
const bookRepository = DBModle.dbInstance.getRepository(Book);
const userRepository = DBModle.dbInstance.getRepository(User);

export const transactionMutation = {
  createTransaction: async (
    _,
    { input }: { input: Transaction[] },
    context: any
  ) => {
    const obj = input?.at(0);
    const { book, transactionType, quantity } = obj;
    const isPurchase = transactionType === TRANSACTION_TYPE.PURCHASE;
    try {
      const bookDetail = await bookRepository.findOne({
        where: { id: book as unknown as string },
      });
      const amount =
        quantity * (isPurchase ? bookDetail.cost : bookDetail.rentPrice);
      const newTransaction = transactionRepository.create({
        ...obj,
        user: context.user?.id,
      });
      const [transactionResponse] = await Promise.all([
        transactionRepository.save(newTransaction),
        bookRepository.update(book as unknown as string, {
          quantityAvailable:
            transactionType === TRANSACTION_TYPE.RETURN
              ? bookDetail.quantityAvailable + quantity
              : bookDetail.quantityAvailable - quantity,
        }),
        userRepository.update(context.user.id, {
          balance: context.user.balance - amount,
        }),
      ]);

      if (!transactionResponse) {
        throw new GraphQLError("Failed to save transaction");
      }

      return transactionResponse;
    } catch (error) {
      console.error("Error creating transaction:", error);
      throw new GraphQLError("Failed to create transaction", error);
    }
  },

  updateTransaction: async (
    _,
    args: { id: string; input: Partial<Transaction> }
  ) => {
    const { id, input } = args;
    try {
      const transaction = await transactionRepository.findOne({
        where: { id },
      });
      if (!transaction) {
        throw new GraphQLError(`Transaction with ID ${id} not found`);
      }
      Object.assign(transaction, input);
      const updatedTransaction = await transactionRepository.save(transaction);
      return updatedTransaction;
    } catch (error) {
      console.error("Error updating transaction:", error);
      throw new GraphQLError("Failed to update transaction");
    }
  },

  deleteTransaction: async (_, args: { id: string }) => {
    const { id } = args;
    try {
      const transactionToDelete = await transactionRepository.findOne({
        where: { id },
      });
      if (!transactionToDelete) {
        throw new GraphQLError(`Transaction with ID ${id} not found`);
      }
      await transactionRepository.remove(transactionToDelete);
      return { message: "Transaction deleted successfully", success: true };
    } catch (error) {
      console.error("Error deleting transaction:", error);
      throw new GraphQLError("Failed to delete transaction");
    }
  },
};
