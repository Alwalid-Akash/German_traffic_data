const fs = require("fs-extra");
const path = require("path");
const db = require("./db");

async function initDatabase() {
  const schemaPath = path.join(__dirname, "../../sql/schema.sql");
  const schemaSql = await fs.readFile(schemaPath, "utf8");

  await db.query(schemaSql);

  console.log("Database schema created successfully.");
  await db.close();
}

initDatabase().catch(async err => {
  console.error("Database init failed:", err.message);
  await db.close();
  process.exit(1);
});