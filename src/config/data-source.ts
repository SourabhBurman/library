import "dotenv/config";
import { DataSource } from "typeorm";
import { DB_CONFIG } from "./db.config";

/**
 * Standalone DataSource for the TypeORM CLI (`migration:generate`,
 * `migration:run`, `migration:revert`). The running app doesn't use this —
 * it uses `DBModle` in db.connection.ts — this file exists purely because
 * the CLI needs to import an already-constructed `DataSource` instance.
 */
export default new DataSource(DB_CONFIG);
