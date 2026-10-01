import { bookTypeDef } from "./book.typedef";
import { permissionTypeDef } from "./permission.typedef";
import { roleTypeDef } from "./role.typedef";
import { UserTypeDef } from "./user.typedef";
import { libraryTypeDefs } from "./library.typedef";
import { orderTypeDefs } from "./order.typedef";
import { transactionTypeDef } from "./transaction.typedef";
import { libraryBookTypeDefs } from "./libraryBook.typedef";
import { notificationTypeDef } from "./notification.typedef";
import { reviewTypeDef } from "./review.typedef";
import { savedBookTypeDef } from "./savedBook.typedef";
import { waitlistTypeDef } from "./waitlist.typedef";
import { auditLogTypeDef } from "./auditLog.typedef";

export const typeDefs = [
  bookTypeDef,
  UserTypeDef,
  roleTypeDef,
  permissionTypeDef,
  libraryTypeDefs,
  orderTypeDefs,
  transactionTypeDef,
  libraryBookTypeDefs,
  notificationTypeDef,
  reviewTypeDef,
  savedBookTypeDef,
  waitlistTypeDef,
  auditLogTypeDef,
];
