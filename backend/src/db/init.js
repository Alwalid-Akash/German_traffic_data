// src/db/init.js
const pool = require("./db");
const fs = require("fs");
const path = require("path");

async function initDB() {
  // Fix the path - look in the project root or current directory
  const possiblePaths = [
    path.resolve(__dirname, "../../pgsql/schemas.sql"),
    path.resolve(__dirname, "../schemas.sql"),
    path.resolve(process.cwd(), "schemas.sql"),
    path.resolve(process.cwd(), "pgsql/schemas.sql"),
  ];

  let schemaPath = null;
  for (const tryPath of possiblePaths) {
    if (fs.existsSync(tryPath)) {
      schemaPath = tryPath;
      break;
    }
  }

  if (!schemaPath) {
    throw new Error(`schema.sql not found in any of: ${possiblePaths.join(", ")}`);
  }

  try {
    const sql = fs.readFileSync(schemaPath, "utf8");
    await pool.query(sql);
    console.log(`✅ Database schema loaded from: ${schemaPath}`);
  } catch (error) {
    console.error("❌ Failed to initialize database:", error.message);
    throw error;
  }
}

module.exports = { initDB };