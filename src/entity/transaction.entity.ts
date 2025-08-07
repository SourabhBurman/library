import {
  Column,
  Entity,
  JoinTable,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { TRANSACTION_TYPE } from "../enums";
import { User } from "./user.entity";
import { Book } from "./books.entity";

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn()
  id: string;

  @Column({
    type: "enum",
    enum: TRANSACTION_TYPE,
    default: TRANSACTION_TYPE.BORROW,
  })
  transactionType: TRANSACTION_TYPE;

  @Column({ type: "int", nullable: false })
  quantity: number;

  @Column({ type: "date", default: () => "CURRENT_DATE" })
  transactionDate: Date;

  @ManyToOne(() => User, (user) => user.transactions)
  user: User;

  @ManyToOne(() => Book, (book) => book.transactions)
  book: Book;
}
