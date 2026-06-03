import { GraphQLError } from "graphql";
import { DBModle } from "../../../config/db.connection";
import {
  ORDER_STATUS,
  ORDER_STATUS_ENUM,
  TRANSACTION_TYPE,
} from "../../../enums";
import { TransactionHistory } from "../../../entity/transactionHistory.entity";
import { User } from "../../../entity/user.entity";
import { Library } from "../../../entity/library.entity";
import { LibraryBook } from "../../../entity/library_book.entity";
import { Order } from "../../../entity/order.entity";
import { PlaceOrderInputType, ReturnOrder } from "../../interfaces/order.type";
import { Book } from "../../../entity/books.entity";
import { PENALTY_PERCENT, SECURITY_PERCENT } from "../../../util/constant";

export const orderMutation = {
  placeOrder: async (
    _,
    { input }: { input: PlaceOrderInputType[] },
    context: any,
  ) => {
    // for now we are only supporting single order
    const obj = input?.[0];

    let { bookId, libraryId, transactionType } = obj;

    const queryRunner = DBModle.dbInstance.createQueryRunner();

    await queryRunner.startTransaction();
    try {
      // find library by id
      const selectedLibrary = await queryRunner.manager.findOneBy(Library, {
        id: libraryId,
      });

      // find book by id
      const bookDetail = await queryRunner.manager.findOneBy(Book, {
        id: bookId,
      });

      // find library book by book id and library id
      const libraryBookDetail = await queryRunner.manager.findOne(LibraryBook, {
        where: { book: bookDetail, library: selectedLibrary },
      });

      // find current user
      const currentUser = await queryRunner.manager.findOne(User, {
        where: { id: context.user?.id },
      });

      if (!selectedLibrary) {
        throw new GraphQLError("Library not found");
      }

      if (!bookDetail) {
        throw new GraphQLError("Book not found");
      }

      if (!libraryBookDetail) {
        throw new GraphQLError("Book not found in library");
      }

      const GET_AMOUNT = {
        [TRANSACTION_TYPE.PURCHASE]: bookDetail.cost,
        [TRANSACTION_TYPE.BORROW]: bookDetail.rentPrice,
      };

      let amount = GET_AMOUNT[transactionType];

      // security deposit for borrow
      if (transactionType === TRANSACTION_TYPE.BORROW) {
        amount += SECURITY_PERCENT * GET_AMOUNT[TRANSACTION_TYPE.PURCHASE];
      }

      if (bookDetail?.quantityAvailable <= 0) {
        throw new GraphQLError("Insufficient quantities available");
      }

      if (currentUser.balance < amount) {
        throw new GraphQLError("Insufficient balance");
      }

      const newOrder = queryRunner.manager.create(Order, {
        current_status: ORDER_STATUS[transactionType],
        user: currentUser,
        libraryBook: libraryBookDetail,
      });

      const savedOrder = await queryRunner.manager.save(newOrder);

      // update book quantity in that particular library
      await queryRunner.manager.update(LibraryBook, libraryBookDetail.id, {
        quantityAvailable: libraryBookDetail.quantityAvailable - 1,
      });

      // update user balance
      await queryRunner.manager.update(User, currentUser.id, {
        balance: currentUser.balance - amount,
      });

      // update library balance
      await queryRunner.manager.update(Library, selectedLibrary.id, {
        balance: (selectedLibrary.balance ?? 0) + amount,
      });

      // create and save transaction

      const newTransaction = queryRunner.manager.create(TransactionHistory, {
        order: newOrder,
        transactionType: transactionType as TRANSACTION_TYPE,
      });

      await queryRunner.manager.save(TransactionHistory, newTransaction);

      await queryRunner.commitTransaction();
      return [savedOrder];
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof GraphQLError) {
        throw error;
      }
      throw new GraphQLError("Failed to create transaction");
    } finally {
      await queryRunner.release();
    }
  },
  returnOrder: async (_, { input }: { input: ReturnOrder[] }, context: any) => {
    // for now we are only supporting single order
    const obj = input?.[0];

    let orderId = obj?.orderId;

    const queryRunner = DBModle.dbInstance.createQueryRunner();

    await queryRunner.startTransaction();
    try {
      // find order by id
      const orderDetail = await queryRunner.manager.findOne(Order, {
        where: { id: orderId },
        relations: [
          "libraryBook",
          "libraryBook.book",
          "libraryBook.library",
          "user",
        ],
      });

      const libraryBookDetail = orderDetail?.libraryBook;
      const bookDetail = libraryBookDetail?.book;
      const selectedLibrary = libraryBookDetail?.library;
      const currentUser = orderDetail?.user;

      if (!orderDetail) {
        throw new GraphQLError("Order not found");
      }

      if (orderDetail.current_status !== ORDER_STATUS_ENUM.BORROWED) {
        throw new GraphQLError("Order is not in borrowed state");
      }

      if (orderDetail.user.id !== context.user?.id) {
        throw new GraphQLError("You are not authorized to return this order");
      }

      if (!selectedLibrary) {
        throw new GraphQLError("Library not found");
      }

      if (!bookDetail) {
        throw new GraphQLError("Book not found");
      }

      if (!libraryBookDetail) {
        throw new GraphQLError("Book not found in library");
      }

      const refundAmount = 0.5 * (bookDetail.cost || 0);
      let extraDays = 0;
      const today = new Date();
      if (
        orderDetail.expectedReturnDate &&
        today.getTime() > orderDetail.expectedReturnDate.getTime()
      ) {
        const diffTime =
          today.getTime() - orderDetail.expectedReturnDate.getTime();
        extraDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      const penalty =
        extraDays * (PENALTY_PERCENT * (bookDetail.rentPrice || 0));
      const finalRefundAmount = refundAmount - penalty;

      if (currentUser.balance + finalRefundAmount < 0) {
        throw new GraphQLError("Insufficient balance to cover late penalties");
      }

      const savedOrder = await queryRunner.manager.update(
        Order,
        orderDetail.id,
        {
          current_status: ORDER_STATUS_ENUM.RETURNED,
        },
      );

      // update book quantity in that particular library
      await queryRunner.manager.update(LibraryBook, libraryBookDetail.id, {
        quantityAvailable: libraryBookDetail.quantityAvailable + 1,
      });

      // update user balance
      await queryRunner.manager.update(User, currentUser.id, {
        balance: currentUser.balance + finalRefundAmount,
      });

      // update library balance
      await queryRunner.manager.update(Library, selectedLibrary.id, {
        balance: (selectedLibrary.balance ?? 0) - finalRefundAmount,
      });

      // create and save transaction

      const newTransaction = queryRunner.manager.create(TransactionHistory, {
        order: orderDetail,
        transactionType: TRANSACTION_TYPE.RETURN,
      });

      await queryRunner.manager.save(TransactionHistory, newTransaction);

      await queryRunner.commitTransaction();
      return [savedOrder];
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof GraphQLError) {
        throw error;
      }
      throw new GraphQLError(error.message || "Failed to create transaction");
    } finally {
      await queryRunner.release();
    }
  },
};
