import { CreateDateColumn, PrimaryGeneratedColumn } from "typeorm";

export abstract class BaseModel {
  @PrimaryGeneratedColumn()
  id: string;

  @CreateDateColumn()
  createdAt: Date;
}
