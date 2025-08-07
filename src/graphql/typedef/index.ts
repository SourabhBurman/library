import { bookTypeDef } from "./book.typedef";
import { permissionTypeDef } from "./permission.typedef";
import { roleTypeDef } from "./role.typedef";
import { transactionTypeDef } from "./transaction.typedef";
import { UserTypeDef } from "./user.typedef";

export const typeDefs = [
  bookTypeDef,
  UserTypeDef,
  roleTypeDef,
  permissionTypeDef,
  transactionTypeDef,
];
