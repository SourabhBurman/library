import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { BOOK_GENRE } from "../enums";
import { Author } from "./author.entity";
import { Reader } from "./user.entity";

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

  @ManyToOne(() => Author, (author) => author.books)
  author: Author;

  @ManyToMany(() => Reader, (reader) => reader.books)
  @JoinTable({ name: "library" })
  readers: Reader[]; // One book can be read by many readers
}
