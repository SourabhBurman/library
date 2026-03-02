import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { BOOK_GENRE } from "../enums";
import { Transaction } from "./transaction.entity";
import { User } from "./user.entity";
import { BookUser } from "./bookUser.entity";

@Entity()
export class Book {
  @PrimaryGeneratedColumn()
  id: string;

  @Column({ type: "varchar", nullable: false })
  name: string;

  @Column({ type: "varchar" })
  description: string;

  @Column({ type: "enum", enum: BOOK_GENRE, default: BOOK_GENRE.OTHER })
  genre: BOOK_GENRE;

  @Column({ type: "int", default: 1, comment: "Total number of copies" })
  total_quantities: number;

  @Column({ type: "int", default: 1 })
  quantity_available: number;

  @Column({ type: "float", nullable: true, comment: "Price in INR" })
  cost: number;

  @Column({
    type: "float",
    nullable: true,
    comment: "Price in INR for a day",
  })
  rent_price: number;

  @Column({ type: "date", nullable: true })
  published_date: Date;

  @OneToMany(() => Book, (book) => book.transactions)
  transactions: Transaction[];

  @ManyToOne(()=> User, (user)=> user.published_books)
  author: User;

  @OneToMany(()=> BookUser, (book_user)=> book_user.book)
  book_users: BookUser[];

}
