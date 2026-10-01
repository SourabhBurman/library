/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  // Unit tests (*.test.ts next to the code) run by default; integration
  // tests are separated into their own project so `npm test` (fast, no DB
  // needed) and `npm run test:integration` (needs Postgres) stay distinct.
  projects: [
    {
      displayName: "unit",
      preset: "ts-jest",
      testEnvironment: "node",
      testMatch: ["<rootDir>/src/**/*.test.ts"],
      // testPathIgnorePatterns takes a regex, not a glob.
      testPathIgnorePatterns: ["\\.integration\\.test\\.ts$"],
    },
    {
      displayName: "integration",
      preset: "ts-jest",
      testEnvironment: "node",
      testMatch: ["<rootDir>/src/**/*.integration.test.ts"],
      setupFilesAfterEnv: ["<rootDir>/src/test/integrationSetup.ts"],
    },
  ],
};
