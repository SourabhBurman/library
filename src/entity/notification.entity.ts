import { Column, Entity, ManyToOne } from "typeorm";
import { BaseModel } from "./base.entity";
import { User } from "./user.entity";
import { Order } from "./order.entity";
import { NOTIFICATION_TYPE } from "../enums";

@Entity()
export class Notification extends BaseModel {
  @Column({
    type: "enum",
    enum: NOTIFICATION_TYPE,
    default: NOTIFICATION_TYPE.GENERAL,
  })
  type: NOTIFICATION_TYPE;

  @Column({ type: "varchar" })
  message: string;

  @Column({ type: "boolean", default: false })
  isRead: boolean;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  user: User;

  @ManyToOne(() => Order, { onDelete: "CASCADE", nullable: true })
  order: Order | null;
}
