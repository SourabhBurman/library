import { GraphQLError } from "graphql";
import { DBModle } from "../../../config/db.connection";
import { Order } from "../../../entity/order.entity";
import { User } from "../../../entity/user.entity";
import { Library } from "../../../entity/library.entity";
import { TransactionHistory } from "../../../entity/transactionHistory.entity";
import { requireAuth } from "../../../util/auth";

export const orderQueries = {
  getOrders: async (_, __, context: any) => {
    if (!context.user) {
      throw new GraphQLError("Unauthorized");
    }

    try {
      const orders = await DBModle.dbInstance.manager.find(Order, {
        where: { user: { id: context.user.id } },
        relations: [
          "libraryBook",
          "libraryBook.book",
          "libraryBook.library",
          "transactions",
          "user",
        ],
        order: { createdAt: "DESC" },
      });

      return orders.map((order) => ({
        ...order,
        book: order.libraryBook.book,
        library: order.libraryBook.library,
      }));
    } catch (error) {
      throw new GraphQLError(error?.message ?? "Failed to fetch orders");
    }
  },

  // Orders placed against the library owned by the current user. `getOrders`
  // above only ever returns the current user's *own* orders (as a
  // borrower/purchaser), which is never useful for a Library Owner viewing
  // their own library's activity.
  getLibraryOrders: async (_, __, context: any) => {
    if (!context.user) {
      throw new GraphQLError("Unauthorized");
    }

    try {
      const library = await DBModle.dbInstance.manager.findOne(Library, {
        where: { owner: { id: context.user.id } },
      });

      if (!library) {
        throw new GraphQLError("You do not own a library");
      }

      const orders = await DBModle.dbInstance.manager.find(Order, {
        where: { libraryBook: { library: { id: library.id } } },
        relations: [
          "libraryBook",
          "libraryBook.book",
          "libraryBook.library",
          "transactions",
          "user",
        ],
        order: { createdAt: "DESC" },
      });

      return orders.map((order) => ({
        ...order,
        book: order.libraryBook.book,
        library: order.libraryBook.library,
      }));
    } catch (error) {
      if (error instanceof GraphQLError) throw error;
      throw new GraphQLError(error?.message ?? "Failed to fetch library orders");
    }
  },

  // The webhook is the only thing that settles a payment, and it can land
  // before or after the browser finishes Stripe's confirmPayment — so the
  // success page polls this (alongside the live `payment_status` socket
  // event) instead of trusting the client-side Stripe.js result.
  getPaymentStatus: async (
    _,
    { paymentIntentId }: { paymentIntentId: string },
    context: any,
  ) => {
    const user = requireAuth(context);

    const transaction = await DBModle.dbInstance.manager.findOne(
      TransactionHistory,
      {
        where: { stripePaymentIntentId: paymentIntentId },
        relations: ["order", "order.user", "order.libraryBook", "order.libraryBook.book"],
      },
    );

    // Someone else's payment is reported exactly like a missing one, so
    // this can't be used to probe which intent ids exist.
    if (!transaction || String(transaction.order?.user?.id) !== String(user.id)) {
      throw new GraphQLError("Payment not found", {
        extensions: { code: "NOT_FOUND" },
      });
    }

    return {
      paymentIntentId,
      paymentStatus: transaction.paymentStatus,
      orderId: transaction.order.id,
      orderStatus: transaction.order.current_status,
      bookName: transaction.order.libraryBook?.book?.name ?? null,
    };
  },
};
