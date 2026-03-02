import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ROLE } from "../enums";
import { Permission } from "./permission.entity";
import { User } from "./user.entity";

@Entity()
export class Role {
  @PrimaryGeneratedColumn()
  id: string;

  @Column({ type: "enum", enum: ROLE, default: ROLE.READER, unique: true })
  role: ROLE;

  @Column({ type: "varchar", nullable: false })
  display_name: string;

  @OneToMany(() => User, (user) => user.role)
  users: User[];

  @ManyToMany(() => Permission, (permission) => permission.roles)
  @JoinTable({ name: "role_permissions" })
  permissions: Permission[];
}
