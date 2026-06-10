const fs = require("fs-extra");
const path = require("path");
const csv = require("csv-parser");

async function findAccidentFiles(extractedFolder) {
  const files = [];

  async function walk(folder) {
    const items = await fs.readdir(folder);

    for (const item of items) {
      const fullPath = path.join(folder, item);
      const stat = await fs.stat(fullPath);

      if (stat.isDirectory()) {
        await walk(fullPath);
      } else if (item.toLowerCase().endsWith(".csv") || item.toLowerCase().endsWith(".txt")) {
        files.push(fullPath);
      }
    }
  }

  await walk(extractedFolder);

  return files;
}

function guessYearFromFile(filePath) {
  const match = filePath.match(/20\d{2}/);
  return match ? Number(match[0]) : null;
}

async function parseAccidentFile(filePath) {
  const rows = [];

  await new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv({ separator: ";" }))
      .on("data", row => rows.push(row))
      .on("end", resolve)
      .on("error", reject);
  });

  return rows;
}

module.exports = {
  findAccidentFiles,
  parseAccidentFile,
  guessYearFromFile
};