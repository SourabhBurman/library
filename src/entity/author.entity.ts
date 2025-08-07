import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Book } from "./books.entity";

@Entity()
export class Author {
  @PrimaryGeneratedColumn()
  id: string;

  @Column({ type: "varchar", nullable: false })
  name: string;

  @Column({ type: "varchar" })
  email: string;

  @Column({ type: "int" })
  age: number;

  @OneToMany(() => Book, (book) => book.author)
  publishedBooks: Book[]; // One author can have many books
}
