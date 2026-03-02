import { Column, Entity, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Book } from "./books.entity";
import { User } from "./user.entity";
import { TRANSACTION_TYPE } from "../enums";

@Entity()
export class BookUser {
  @PrimaryGeneratedColumn()
  id: string;
  
  @Column({ type: "enum", enum: TRANSACTION_TYPE, default: TRANSACTION_TYPE.BORROW })
    transaction_type: TRANSACTION_TYPE;

  @ManyToOne(() => Book, (book) => book.book_users)
  book: Book;

  @ManyToOne(() => User, (user) => user.book_users)
  user: User;
}