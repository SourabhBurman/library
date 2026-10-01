import { Entity, Index, ManyToOne } from "typeorm";
import { BaseModel } from "./base.entity";
import { User } from "./user.entity";
import { Book } from "./books.entity";

@Entity()
@Index(["user", "book"], { unique: true })
export class Waitlist extends BaseModel {
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  user: User;

  @ManyToOne(() => Book, { onDelete: "CASCADE" })
  book: Book;
}
