import { Column, Entity, ManyToOne, OneToMany } from "typeorm";
import { BaseModel } from "./base.entity";
import { User } from "./user.entity";
import { LibraryBook } from "./library_book.entity";
import { TransactionHistory } from "./transactionHistory.entity";
import { ORDER_STATUS_ENUM } from "../enums";

@Entity()
export class Order extends BaseModel {
    
 @Column({type: "enum", enum: ORDER_STATUS_ENUM, nullable: false, default: ORDER_STATUS_ENUM.BORROWED})
 current_status: ORDER_STATUS_ENUM;

 @Column({type: "timestamp", nullable: true})
 expectedReturnDate: Date;

 @ManyToOne(()=> User, (user)=> user.orders)
 user: User;

 @ManyToOne(()=> LibraryBook, (libraryBook)=> libraryBook.orders)
 library_book: LibraryBook;

 @OneToMany(()=> TransactionHistory, (transactionHistory)=> transactionHistory.order)
 transactions: TransactionHistory[];
}   