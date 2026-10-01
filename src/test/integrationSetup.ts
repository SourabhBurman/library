// Runs once, before any other import in each integration test file, so that
// when db.config.ts later reads process.env.DB_NAME it points at the
// disposable test database instead of your real one. Never point this at
// the real DB — this database gets truncated between every test.
process.env.DB_NAME = "library_test";

import { DBModle } from "../config/db.connection";

beforeAll(async () => {
  await DBModle.dbInstance.initialize();
  // This test DB is throwaway and rebuilt on demand, so `synchronize` here
  // is fine — it's a deliberate exception to "always use migrations",
  // acceptable specifically because nothing here is real, persistent data.
  await DBModle.dbInstance.synchronize(true);
});

afterEach(async () => {
  // Truncate every table between tests so each test starts from a clean
  // slate, without paying the cost of reconnecting.
  const tables = DBModle.dbInstance.entityMetadatas.map((m) => `"${m.tableName}"`);
  if (tables.length > 0) {
    await DBModle.dbInstance.query(
      `TRUNCATE ${tables.join(", ")} RESTART IDENTITY CASCADE;`,
    );
  }
});

afterAll(async () => {
  await DBModle.dbInstance.destroy();
});
