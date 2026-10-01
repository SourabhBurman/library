import { Column, Entity, Index, ManyToOne } from "typeorm";
import { BaseModel } from "./base.entity";
import { User } from "./user.entity";
import { Book } from "./books.entity";

@Entity()
@Index(["user", "book"], { unique: true })
export class Review extends BaseModel {
  @Column({ type: "int" })
  rating: number;

  @Column({ type: "varchar", nullable: true })
  comment: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  user: User;

  @ManyToOne(() => Book, (book) => book.reviews, { onDelete: "CASCADE" })
  book: Book;
}
