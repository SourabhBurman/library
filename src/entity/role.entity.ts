import { Column, Entity, JoinTable, ManyToMany, OneToMany } from "typeorm";
import { BaseModel } from "./base.entity";
import { ROLE } from "../enums";
import { Permission } from "./permission.entity";
import { User } from "./user.entity";

@Entity()
export class Role extends BaseModel {
  @Column({ type: "enum", enum: ROLE, default: ROLE.READER })
  type: ROLE;

  @Column({ type: "varchar", nullable: false })
  displayName: string;

  @OneToMany(() => User, (user) => user.role)
  users: User[];

  @ManyToMany(() => Permission, (permission) => permission.roles)
  @JoinTable({ name: "role_permissions" })
  permissions: Permission[];
}
