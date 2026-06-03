import { DataSource } from "typeorm";
import { DB_CONFIG } from "./db.config";
import { User } from "../entity/user.entity";
import { Permission } from "../entity/permission.entity";
import { Book } from "../entity/books.entity";
import { Library } from "../entity/library.entity";
import { Role } from "../entity/role.entity";
import { TransactionHistory } from "../entity/transactionHistory.entity";
import { LibraryBook } from "../entity/library_book.entity";
import { Order } from "../entity/order.entity";

export class DBModle {
  public static readonly dbInstance = new DataSource(DB_CONFIG);

  public static async connect() {
    try {
      await this.dbInstance.initialize();
      console.log("Database connected successfully");
    } catch (error) {
      console.error("Error connecting to the database", error);
    }
  }
}

export const userRepository = DBModle.dbInstance.getRepository(User);
export const roleRepository = DBModle.dbInstance.getRepository(Role);
export const permissionRepository =
  DBModle.dbInstance.getRepository(Permission);
export const transactionRepository =
  DBModle.dbInstance.getRepository(TransactionHistory);
export const bookRepository = DBModle.dbInstance.getRepository(Book);
export const libraryRepository = DBModle.dbInstance.getRepository(Library);
export const libraryBookRepository =
  DBModle.dbInstance.getRepository(LibraryBook);
export const orderRepository = DBModle.dbInstance.getRepository(Order);
