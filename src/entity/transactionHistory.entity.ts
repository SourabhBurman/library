import {
  Column,
  Entity,
  ManyToOne,
} from "typeorm";
import { BaseModel } from "./base.entity";
import { TRANSACTION_TYPE } from "../enums";
import { Order } from "./order.entity";

@Entity()
export class TransactionHistory extends BaseModel {

  @Column({
    type: "enum",
    enum: TRANSACTION_TYPE,
    default: TRANSACTION_TYPE.BORROW,
  })
  transaction_type: TRANSACTION_TYPE;

  @Column({ type: "date", default: () => "CURRENT_DATE" })
  transaction_date: Date;

  @ManyToOne(()=> Order, (order)=> order.transactions)
  order: Order;
}
