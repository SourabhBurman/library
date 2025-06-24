import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from "typeorm";
import { GENDER } from "../enums";
import { Book } from "./books.entity";

@Entity()
export class Reader {
  @PrimaryGeneratedColumn()
  id: string;

  @Column({ type: "varchar", nullable: false })
  name: string;

  @Column({ type: "enum", enum: GENDER, default: GENDER.OTHER })
  gender: GENDER;

  @ManyToMany(() => Book, (book) => book.readers)
  books: Book[]; // One reader can have many books
}
