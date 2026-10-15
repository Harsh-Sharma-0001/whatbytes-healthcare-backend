const { Pool } = require("pg");
const { databaseUrl, nodeEnv } = require("../config/env");

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: nodeEnv === "production" ? { rejectUnauthorized: true } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

pool.on("error", (err) => {
  console.error("Unexpected idle PostgreSQL client error:", err.message);
});

module.exports = pool;
