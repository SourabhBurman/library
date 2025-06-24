import { DataSource } from "typeorm";
import { DB_CONFIG } from "./db.config";

export class DBModle {
  public static readonly dbInstance = new DataSource(DB_CONFIG);

  public static async connect() {
    try {
      await this.dbInstance.initialize();
      console.log("Database connected successfully");
    } catch (error) {
      console.error("Error connecting to the database", error);
    }
  }
}
