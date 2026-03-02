import { DataSourceOptions } from "typeorm";
import { Book } from "../entity/books.entity";
import { User } from "../entity/user.entity";
import { Role } from "../entity/role.entity";
import { Permission } from "../entity/permission.entity";
import { Transaction } from "../entity/transaction.entity";
import { BookUser } from "../entity/bookUser.entity";

export const DB_CONFIG: DataSourceOptions = {
  type: "postgres",
  host: process.env.DB_HOST,
  username: "postgres",
  password: "123456",
  database: "library",
  synchronize: true,
  logging: true,
  entities: [Book, User, Role, Permission, Transaction, BookUser],
};
