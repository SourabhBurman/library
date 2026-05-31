import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  OneToOne
} from "typeorm";
import { BaseModel } from "./base.entity";
import { GENDER } from "../enums";
import { Library } from "./library.entity";
import { Role } from "./role.entity";
import { Order } from "./order.entity";

@Entity()
export class User extends BaseModel {

  @Column({ type: "varchar", nullable: false })
  name: string;

  @Column({ type: "enum", enum: GENDER, default: GENDER.OTHER })
  gender: GENDER;

  @Column({ type: "varchar", nullable: false, unique: true })
  email: string;

  @Column({ type: "varchar", nullable: false })
  password: string;

  @Column({ type: "float", default: 0, comment: "Balance in INR" })
  balance: number;

  @ManyToOne(() => Role, (role) => role.users)
  role: Role;

  @OneToOne(()=> Library, (library)=> library.owner)
  library_owned: Library;

  @OneToMany(()=> Order, (order)=> order.user)
  orders: Order[];
}
