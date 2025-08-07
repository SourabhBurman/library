import {
  Column,
  Entity,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { GENDER } from "../enums";
import { Role } from "./role.entity";
import { Transaction } from "./transaction.entity";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: string;

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

  @OneToMany(() => Transaction, (transaction) => transaction.user)
  transactions: Transaction[];
}
