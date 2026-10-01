import { GraphQLError } from "graphql";
import { DBModle } from "../../../config/db.connection";
import { Order } from "../../../entity/order.entity";
import { User } from "../../../entity/user.entity";
import { Library } from "../../../entity/library.entity";

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
};
