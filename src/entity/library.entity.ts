import {
  Check,
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
} from "typeorm";
import { BaseModel } from "./base.entity";
import { User } from "./user.entity";
import { LibraryBook } from "./library_book.entity";

@Entity()
@Check("rating >= 0 AND rating <= 5")
export class Library extends BaseModel {
  @Column({ type: "varchar", nullable: false, unique: true })
  name: string;

  @Column({ type: "varchar" })
  address: string;

  @Column({ type: "int", nullable: true })
  rating: number;

  @Column({ type: "int", default: 0 })
  balance: number;

  @OneToOne(() => User, (user) => user.library_owned)
  @JoinColumn({ name: "ownerId" })
  owner: User;

  @OneToMany(() => LibraryBook, (libraryBook) => libraryBook.library)
  libraryBooks: LibraryBook[];
}
