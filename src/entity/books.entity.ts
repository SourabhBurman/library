import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { BOOK_GENRE } from "../enums";
import { Transaction } from "./transaction.entity";

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
  totalQuantities: number;

  @Column({ type: "int", default: 1 })
  quantityAvailable: number;

  @Column({ type: "float", nullable: true, comment: "Price in INR" })
  cost: number;

  @Column({
    type: "float",
    nullable: true,
    comment: "Price in INR for a day",
  })
  rentPrice: number;

  @Column({ type: "date", nullable: true })
  publishedDate: Date;

  @OneToMany(() => Book, (book) => book.transactions)
  transactions: Transaction[];
}
