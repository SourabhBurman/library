import { GraphQLError } from "graphql";
import { DBModle } from "../../../config/db.connection";
import { Order } from "../../../entity/order.entity";
import { User } from "../../../entity/user.entity";

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
};
