import { bookQueries } from "./queries/book.queries";
import { bookMutation } from "./mutations/book.mutation";
import { userMutation } from "./mutations/user.mutation";
import { userQueries } from "./queries/user.queries";
import { roleQueries } from "./queries/role.queries";
import { permissionQueries } from "./queries/permission.queries";
import { permissionMutation } from "./mutations/permissions.mutation";
import { roleMutation } from "./mutations/role.mutation";
import { transactionMutation } from "./mutations/transaction.mutation";
import { transactionQueries } from "./queries/transaction.queries";

export const resolvers = {
  Query: {
    ...bookQueries,
    ...roleQueries,
    ...userQueries,
    ...permissionQueries,
    ...transactionQueries,
  },
  Mutation: {
    ...bookMutation,
    ...userMutation,
    ...permissionMutation,
    ...roleMutation,
    ...transactionMutation,
  },
};
