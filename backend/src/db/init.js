const fs = require("fs-extra");
const path = require("path");
const db = require("./db");

async function initDatabase() {
  const schemaPath = path.join(__dirname, "../../pgsql/schemas.sql");

  console.log("Reading schema file:");
  console.log(schemaPath);

  const schemaSql = await fs.readFile(schemaPath, "utf8");

  await db.testConnection();

  await db.query(schemaSql);

  console.log("Database schema created successfully.");
}

module.exports = {
  initDatabase
};

if (require.main === module) {
  initDatabase()
    .then(async () => {
      await db.close();
      process.exit(0);
    })
    .catch(async err => {
      console.error("Database init failed:", err.message);
      await db.close();
      process.exit(1);
    });
}