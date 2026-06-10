const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Small helper for running SQL queries.
async function query(sql, params = []) {
  return pool.query(sql, params);
}

// Close database connection when script is finished.
async function close() {
  await pool.end();
}

module.exports = {
  query,
  close
};


// Test connection
pool.connect()
  .then(client => {
    console.log("✅ Database connected successfully");
    client.release();
  })
  .catch(err => {
    console.error("Database connection failed:", err.message);
  });

module.exports = pool;