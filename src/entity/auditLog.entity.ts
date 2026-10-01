import { Column, Entity } from "typeorm";
import { BaseModel } from "./base.entity";

/**
 * No FK relation to User on purpose — actorEmail is a point-in-time
 * snapshot so the log entry still makes sense even if the actor's account
 * is later deleted.
 */
@Entity()
export class AuditLog extends BaseModel {
  @Column({ type: "varchar", nullable: true })
  actorId: string | null;

  @Column({ type: "varchar" })
  actorEmail: string;

  @Column({ type: "varchar" })
  action: string;

  @Column({ type: "varchar" })
  targetType: string;

  @Column({ type: "varchar", nullable: true })
  targetId: string | null;

  @Column({ type: "text", nullable: true })
  details: string | null;
}
