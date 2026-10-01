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
import Stripe from "stripe";
import { PAYMENT_STATUS } from "../../../enums";
import { requireAuth } from "../../../util/auth";
import { publishWaitlistCheck } from "../../../util/waitlist";
import {
  calculateBorrowDays,
  calculateOrderAmount,
  calculateReturnRefund,
} from "../../../util/pricing";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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
  expectedReturnDate?: string | Date,
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

  let borrowDays = 1;
  let amount: number;
  try {
    if (transactionType === TRANSACTION_TYPE.BORROW) {
      borrowDays = calculateBorrowDays(expectedReturnDate);
    }
    amount = calculateOrderAmount({
      transactionType: transactionType as TRANSACTION_TYPE,
      cost: bookDetail.cost || 0,
      rentPrice: bookDetail.rentPrice || 0,
      borrowDays,
    });
  } catch (error) {
    // calculateBorrowDays throws a plain Error (it has no GraphQL
    // dependency, by design) — translate it at this boundary.
    throw new GraphQLError(error.message);
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
  returnOrder: async (_, { input }: { input: ReturnOrder[] }, context: any) => {
    requireAuth(context);
    // for now we are only supporting single order
    const obj = input?.[0];

    let orderId = obj?.id;

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

      const { finalRefundAmount } = calculateReturnRefund({
        cost: bookDetail.cost || 0,
        rentPrice: bookDetail.rentPrice || 0,
        expectedReturnDate: orderDetail.expectedReturnDate,
      });

      if (currentUser.balance + finalRefundAmount < 0) {
        throw new GraphQLError("Insufficient balance to cover late penalties");
      }

      await queryRunner.manager.update(Order, orderDetail.id, {
        current_status: ORDER_STATUS_ENUM.RETURNED,
      });

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

      await publishWaitlistCheck(bookDetail.id);

      const updatedOrder = await DBModle.dbInstance.manager.findOne(Order, {
        where: { id: orderDetail.id },
        relations: [
          "libraryBook",
          "libraryBook.book",
          "libraryBook.library",
          "user",
          "transactions",
        ],
      });

      return [updatedOrder];
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
   * Stripe Checkout Flow (Step 1):
   * Validates order details and creates a Stripe PaymentIntent, returning its
   * client secret for the frontend to confirm payment with.
   * Saves a PENDING transaction (and an optimistic Order) in the database.
   * IMPORTANT: Does NOT decrease library book inventory here. Inventory is
   * only updated in the Stripe webhook once payment is officially captured.
   */
  createPaymentIntent: async (
    _,
    { input }: { input: PlaceOrderInputType },
    context: any,
  ) => {
    requireAuth(context);
    let { bookId, libraryId, transactionType, expectedReturnDate } = input;

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
          expectedReturnDate,
        );

      // amount is in INR, multiply by 100 for paise
      const amountInPaise = Math.round(amount * 100);

      // Create Stripe PaymentIntent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInPaise,
        currency: "inr",
        metadata: {
          receipt: `receipt_order_${Date.now()}`,
        },
      });

      const newOrder = queryRunner.manager.create(Order, {
        current_status: ORDER_STATUS[transactionType],
        user: currentUser,
        libraryBook: libraryBookDetail,
        expectedReturnDate: expectedReturnDate
          ? new Date(expectedReturnDate)
          : undefined,
      });

      await queryRunner.manager.save(newOrder);

      const newTransaction = queryRunner.manager.create(TransactionHistory, {
        order: newOrder,
        transactionType: transactionType as TRANSACTION_TYPE,
        amount: amountInPaise,
        paymentStatus: PAYMENT_STATUS.PENDING,
        stripePaymentIntentId: paymentIntent.id,
      });

      await queryRunner.manager.save(TransactionHistory, newTransaction);
      await queryRunner.commitTransaction();

      return {
        clientSecret: paymentIntent.client_secret,
        amount: amountInPaise,
        currency: "INR",
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error("Payment intent creation error:", error);
      if (error instanceof GraphQLError) throw error;
      throw new GraphQLError("Failed to create payment intent");
    } finally {
      await queryRunner.release();
    }
  },
};
