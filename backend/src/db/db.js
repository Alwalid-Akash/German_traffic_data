const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function query(sql, params = []) {
  return pool.query(sql, params);
}

async function close() {
  await pool.end();
}

async function testConnection() {
  try {
    await pool.query("SELECT NOW()");
    console.log("✅ Database connected successfully");
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
    throw err;
  }
}

module.exports = {
  query,
  close,
  testConnection,
};