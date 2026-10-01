import { bookQueries } from "./queries/book.queries";
import { bookMutation } from "./mutations/book.mutation";
import { userMutation } from "./mutations/user.mutation";
import { userQueries } from "./queries/user.queries";
import { roleQueries } from "./queries/role.queries";
import { permissionQueries } from "./queries/permission.queries";
import { permissionMutation } from "./mutations/permissions.mutation";
import { roleMutation } from "./mutations/role.mutation";
import { transactionQueries } from "./queries/transactionHistory.queries";
import { libraryMutation } from "./mutations/library.mutation";
import { orderMutation } from "./mutations/order.mutation";
import { libraryQueries } from "./queries/library.queries";
import { libraryBookQueries } from "./queries/library_book.queries";
import { libraryBookMutation } from "./mutations/libray_book.mutation";

import { orderQueries } from "./queries/order.queries";
import { notificationQueries } from "./queries/notification.queries";
import { notificationMutation } from "./mutations/notification.mutation";
import { reviewQueries } from "./queries/review.queries";
import { reviewMutation } from "./mutations/review.mutation";
import { reviewRepository, libraryBookRepository } from "../../config/db.connection";
import { savedBookQueries } from "./queries/savedBook.queries";
import { savedBookMutation } from "./mutations/savedBook.mutation";
import { waitlistQueries } from "./queries/waitlist.queries";
import { waitlistMutation } from "./mutations/waitlist.mutation";
import { auditLogQueries } from "./queries/auditLog.queries";

export const resolvers = {
  Query: {
    ...bookQueries,
    ...roleQueries,
    ...userQueries,
    ...permissionQueries,
    ...transactionQueries,
    ...libraryQueries,
    ...libraryBookQueries,
    ...orderQueries,
    ...notificationQueries,
    ...reviewQueries,
    ...savedBookQueries,
    ...waitlistQueries,
    ...auditLogQueries,
  },
  Mutation: {
    ...bookMutation,
    ...userMutation,
    ...permissionMutation,
    ...roleMutation,
    ...orderMutation,
    ...libraryMutation,
    ...libraryBookMutation,
    ...notificationMutation,
    ...reviewMutation,
    ...savedBookMutation,
    ...waitlistMutation,
  },
  // Any resolver that returns an Order (via a hand-mapped `book`/`library`
  // shortcut, or a raw entity that only carries the `libraryBook` relation)
  // resolves consistently here instead of duplicating the mapping everywhere.
  Order: {
    book: (parent: any) => parent.book ?? parent.libraryBook?.book,
    library: (parent: any) => parent.library ?? parent.libraryBook?.library,
  },
  Book: {
    reviews: (parent: any) =>
      reviewRepository.find({
        where: { book: { id: parent.id } },
        relations: ["user", "book"],
        order: { createdAt: "DESC" },
      }),
    averageRating: async (parent: any) => {
      const reviews = await reviewRepository.find({
        where: { book: { id: parent.id } },
      });
      if (reviews.length === 0) return null;
      const total = reviews.reduce((sum, r) => sum + r.rating, 0);
      return Math.round((total / reviews.length) * 10) / 10;
    },
    // Real, currently-borrowable stock — the sum across every library that
    // stocks this book. Distinct from `quantityAvailable`, which is just
    // the shared pool not yet assigned to any library.
    totalAvailableCopies: async (parent: any) => {
      const libraryBooks = await libraryBookRepository.find({
        where: { book: { id: parent.id } },
      });
      return libraryBooks.reduce(
        (sum, lb) => sum + (lb.quantityAvailable || 0),
        0,
      );
    },
  },
};
