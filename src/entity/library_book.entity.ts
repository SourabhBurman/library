import { Column, Entity, ManyToOne, OneToMany } from "typeorm";
import { BaseModel } from "./base.entity";
import { Library } from "./library.entity";
import { Book } from "./books.entity";
import { Order } from "./order.entity";

@Entity()
export class LibraryBook extends BaseModel {
  @Column({
    type: "int",
    default: 1,
    comment: "Total number of copies in this library",
  })
  totalQuantities: number;

  @Column({
    type: "int",
    default: 1,
    comment: "Available copies to rent in this library",
  })
  quantityAvailable: number;

  @ManyToOne(() => Library, (library) => library.libraryBooks, {
    onDelete: "CASCADE",
  })
  library: Library;

  @ManyToOne(() => Book, (book) => book.libraryBooks, { onDelete: "CASCADE" })
  book: Book;

  @OneToMany(() => Order, (order) => order.libraryBook)
  orders: Order[];
}
