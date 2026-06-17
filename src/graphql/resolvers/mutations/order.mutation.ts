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
import Razorpay from "razorpay";
import { PAYMENT_STATUS } from "../../../enums";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_dummy",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "dummy_secret",
});

/**
 * Shared helper function to validate order prerequisites.
 * Checks if the library, book, and user exist and verifies library inventory levels.
 * Calculates the total order amount based on transaction type (including security deposits for borrows).
 */
const validateAndCalculateOrderDetails = async (
  queryRunner: any,
  libraryId: string,
  bookId: string,
  transactionType: string,
  userId: string,
) => {
  const selectedLibrary = await queryRunner.manager.findOneBy(Library, {
    id: libraryId,
  });
  const bookDetail = await queryRunner.manager.findOneBy(Book, { id: bookId });

  const libraryBookDetail = await queryRunner.manager.findOne(LibraryBook, {
    where: {
      book: { id: bookId },
      library: { id: libraryId },
    },
  });

  const currentUser = await queryRunner.manager.findOne(User, {
    where: { id: userId },
  });

  if (!selectedLibrary || !bookDetail || !libraryBookDetail || !currentUser) {
    throw new GraphQLError("Invalid library, book, or user");
  }

  if (libraryBookDetail.quantityAvailable <= 0) {
    throw new GraphQLError("Insufficient quantities available in this library");
  }

  const GET_AMOUNT = {
    [TRANSACTION_TYPE.PURCHASE]: bookDetail.cost,
    [TRANSACTION_TYPE.BORROW]: bookDetail.rentPrice,
  };

  let amount = GET_AMOUNT[transactionType as TRANSACTION_TYPE];
  if (transactionType === TRANSACTION_TYPE.BORROW) {
    amount += SECURITY_PERCENT * GET_AMOUNT[TRANSACTION_TYPE.PURCHASE];
  }

  return {
    selectedLibrary,
    bookDetail,
    libraryBookDetail,
    currentUser,
    amount,
  };
};

export const orderMutation = {
  /**
   * Legacy/Direct Order Flow:
   * Acts as an instant checkout. Deducts the amount directly from the user's internal wallet balance,
   * immediately creates a PAID order, and instantly decreases the library book's available quantity.
   */
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
      const { selectedLibrary, libraryBookDetail, currentUser, amount } =
        await validateAndCalculateOrderDetails(
          queryRunner,
          libraryId,
          bookId,
          transactionType,
          context.user?.id,
        );

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
        amount: Math.round(amount * 100),
        paymentStatus: PAYMENT_STATUS.PAID,
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
        amount: -Math.round(finalRefundAmount * 100),
        paymentStatus: PAYMENT_STATUS.PAID,
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
  /**
   * Razorpay Checkout Flow (Step 1):
   * Validates order details and calls the Razorpay API to generate a pending order ID.
   * Saves a PENDING order in the database.
   * IMPORTANT: Does NOT decrease library book inventory here. Inventory should be updated
   * in the Razorpay Webhook when payment is officially captured.
   */
  createPaymentIntent: async (
    _,
    { input }: { input: PlaceOrderInputType },
    context: any,
  ) => {
    let { bookId, libraryId, transactionType } = input;

    const queryRunner = DBModle.dbInstance.createQueryRunner();
    await queryRunner.startTransaction();
    try {
      const { libraryBookDetail, currentUser, amount } =
        await validateAndCalculateOrderDetails(
          queryRunner,
          libraryId,
          bookId,
          transactionType,
          context.user?.id,
        );

      // amount is in INR, multiply by 100 for paise
      const amountInPaise = Math.round(amount * 100);

      // Create Razorpay Order
      const rzpOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: `receipt_order_${Date.now()}`,
      });

      const newOrder = queryRunner.manager.create(Order, {
        current_status: ORDER_STATUS[transactionType],
        user: currentUser,
        libraryBook: libraryBookDetail,
      });

      await queryRunner.manager.save(newOrder);

      const newTransaction = queryRunner.manager.create(TransactionHistory, {
        order: newOrder,
        transactionType: transactionType as TRANSACTION_TYPE,
        amount: amountInPaise,
        paymentStatus: PAYMENT_STATUS.PENDING,
        razorpayOrderId: rzpOrder.id,
      });

      await queryRunner.manager.save(TransactionHistory, newTransaction);
      await queryRunner.commitTransaction();

      return {
        razorpayOrderId: rzpOrder.id,
        amount: amountInPaise,
        currency: "INR",
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof GraphQLError) throw error;
      throw new GraphQLError("Failed to create payment intent");
    } finally {
      await queryRunner.release();
    }
  },
};
