import { DataSourceOptions } from "typeorm";
import { Book } from "../entity/books.entity";
import { User } from "../entity/user.entity";
import { Role } from "../entity/role.entity";
import { Permission } from "../entity/permission.entity";
import { TransactionHistory } from "../entity/transactionHistory.entity";
import { Library } from "../entity/library.entity";
import { LibraryBook } from "../entity/library_book.entity";
import { Order } from "../entity/order.entity";
import { Notification } from "../entity/notification.entity";
import { Review } from "../entity/review.entity";
import { SavedBook } from "../entity/savedBook.entity";
import { Waitlist } from "../entity/waitlist.entity";
import { AuditLog } from "../entity/auditLog.entity";

export const DB_CONFIG: DataSourceOptions = {
  type: "postgres",
  host: process.env.DB_HOST,
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "123456",
  database: process.env.DB_NAME || "library",
  // Schema changes now go through reviewable migration files (src/migrations)
  // instead of TypeORM silently altering the live DB to match the entities
  // on every boot.
  synchronize: false,
  // Matches both .ts (dev, via ts-node) and .js (production, after `tsc`
  // compiles src/migrations/*.ts to dist/migrations/*.js) — otherwise this
  // silently finds zero migrations once the app runs from a build.
  migrations: [__dirname + "/../migrations/*.{ts,js}"],
  migrationsTableName: "migrations",
  logging: false,
  entities: [
    Book,
    User,
    Role,
    Permission,
    TransactionHistory,
    Library,
    LibraryBook,
    Order,
    Notification,
    Review,
    SavedBook,
    Waitlist,
    AuditLog,
  ],
};
