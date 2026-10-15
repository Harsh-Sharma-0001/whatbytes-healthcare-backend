const fs = require("node:fs");
const path = require("node:path");
const pool = require("../src/db/pool");

(async () => {
  try {
    const schema = fs.readFileSync(path.join(__dirname, "../sql/schema.sql"), "utf8");
    await pool.query(schema);
    console.log("Database schema initialized successfully.");
  } catch (err) {
    console.error("Database initialization failed:", err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
