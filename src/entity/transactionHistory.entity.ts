import { Column, Entity, ManyToOne } from "typeorm";
import { BaseModel } from "./base.entity";
import { PAYMENT_STATUS, TRANSACTION_TYPE } from "../enums";
import { Order } from "./order.entity";

@Entity()
export class TransactionHistory extends BaseModel {
  @Column({
    type: "enum",
    enum: TRANSACTION_TYPE,
    default: TRANSACTION_TYPE.BORROW,
  })
  transactionType: TRANSACTION_TYPE;

  @Column({ type: "date", default: () => "CURRENT_DATE" })
  transactionDate: Date;

  @Column({ type: "int", nullable: true })
  amount: number | null;

  @Column({
    type: "enum",
    enum: PAYMENT_STATUS,
    nullable: false,
    default: PAYMENT_STATUS.PENDING,
  })
  paymentStatus: PAYMENT_STATUS;

  @Column({ type: "varchar", nullable: true })
  razorpayOrderId: string | null;

  @Column({ type: "varchar", nullable: true })
  razorpayPaymentId: string | null;

  @ManyToOne(() => Order, (order) => order.transactions)
  order: Order;
}
