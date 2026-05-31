import { DataSourceOptions } from "typeorm";
import { Book } from "../entity/books.entity";
import { User } from "../entity/user.entity";
import { Role } from "../entity/role.entity";
import { Permission } from "../entity/permission.entity";
import { TransactionHistory } from "../entity/transactionHistory.entity";
import { Library } from "../entity/library.entity";
import { LibraryBook } from "../entity/library_book.entity";
import { Order } from "../entity/order.entity";

export const DB_CONFIG: DataSourceOptions = {
  type: "postgres",
  host: process.env.DB_HOST,
  username: "postgres",
  password: "123456",
  database: "library",
  synchronize: true,
  logging: false,
  entities: [Book, User, Role, Permission, TransactionHistory, Library, LibraryBook, Order],
};
