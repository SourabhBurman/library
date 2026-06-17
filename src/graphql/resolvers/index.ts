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
  },
  Mutation: {
    ...bookMutation,
    ...userMutation,
    ...permissionMutation,
    ...roleMutation,
    ...orderMutation,
    ...libraryMutation,
    ...libraryBookMutation,
  },
};
