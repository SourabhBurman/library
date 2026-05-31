import { Column, Entity, ManyToOne, OneToMany } from "typeorm";
import { BaseModel } from "./base.entity";
import { Library } from "./library.entity";
import { Book } from "./books.entity";
import { Order } from "./order.entity";

@Entity()
export class LibraryBook extends BaseModel {

  @Column({ type: "int", default: 1, comment: "Total number of copies in this library" })
  total_quantities: number;

  @Column({ type: "int", default: 1, comment: "Available copies to rent in this library" })
  quantity_available: number;

  @ManyToOne(() => Library, (library) => library.library_books, { onDelete: "CASCADE" })
  library: Library;

  @ManyToOne(() => Book, (book) => book.library_books, { onDelete: "CASCADE" })
  book: Book;

  @OneToMany(()=> Order, (order)=> order.library_book)
  orders: Order[];
}
