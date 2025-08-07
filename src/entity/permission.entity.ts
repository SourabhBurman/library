import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from "typeorm";
import { Role } from "./role.entity";

@Entity()
export class Permission {
  @PrimaryGeneratedColumn()
  id: string;

  @Column({ type: "varchar", nullable: false, unique: true })
  name: string;

  @Column({ type: "varchar" })
  description: string;

  @ManyToMany(() => Role, (role) => role.permissions)
  roles: Role[]; // One permission can be associated with many roles
}
