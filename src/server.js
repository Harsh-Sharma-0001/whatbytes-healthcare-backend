const app = require("./app");
const pool = require("./db/pool");
const { port } = require("./config/env");

const server = app.listen(port, async () => {
  try {
    await pool.query("SELECT 1");
    console.log(`Healthcare API running at http://localhost:${port}`);
    console.log("PostgreSQL connection successful.");
  } catch (err) {
    console.error("Unable to connect to PostgreSQL:", err.message);
    server.close(() => process.exit(1));
  }
});

async function shutdown(signal) {
  console.log(`${signal} received; shutting down...`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
