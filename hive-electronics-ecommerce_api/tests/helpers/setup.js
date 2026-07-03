// Runs before every test file via vitest.config.js setupFiles.
// Sets environment variables required by middleware and JWT helpers.
// Does NOT connect to MongoDB — each test file manages its own connection via db.js.

process.env.JWT_SECRET = "test_jwt_secret_vitest_hive_electronics_not_for_production";
process.env.JWT_REFRESH_TOKEN = "test_refresh_secret_vitest_hive_electronics_not_for_production";
process.env.PORT = "3001";
