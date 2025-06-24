import { DataSourceOptions } from "typeorm";
import { Author } from "../entity/author.entity";
import { Book } from "../entity/books.entity";
import { Reader } from "../entity/user.entity";

export const DB_CONFIG: DataSourceOptions = {
  type: "postgres",
  host: process.env.DB_HOST,
  username: "postgres",
  password: "123456",
  database: "library",
  synchronize: true,
  entities: [Author, Book, Reader],
};
