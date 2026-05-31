import { Column, Entity, ManyToMany } from "typeorm";
import { BaseModel } from "./base.entity";
import { Role } from "./role.entity";

@Entity()
export class Permission extends BaseModel {

  @Column({ type: "varchar", nullable: false, unique: true })
  name: string;

  @Column({ type: "varchar" })
  description: string;

  @ManyToMany(() => Role, (role) => role.permissions)
  roles: Role[]; // One permission can be associated with many roles
}
