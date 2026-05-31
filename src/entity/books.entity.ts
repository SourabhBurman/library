import { Column, Entity, OneToMany } from "typeorm";
import { BaseModel } from "./base.entity";
import { BOOK_GENRE } from "../enums";
import { LibraryBook } from "./library_book.entity";

@Entity()
export class Book extends BaseModel {

  @Column({ type: "varchar", nullable: false })
  name: string;

  @Column({ type: "varchar" })
  description: string;

  @Column({ type: "enum", enum: BOOK_GENRE, default: BOOK_GENRE.OTHER })
  genre: BOOK_GENRE;

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

  @OneToMany(() => LibraryBook, (libraryBook) => libraryBook.book)
  library_books: LibraryBook[];
}
