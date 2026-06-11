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
      } else {
        const lower = item.toLowerCase();

        if (
          (lower.endsWith(".csv") || lower.endsWith(".txt")) &&
          lower.includes("unfallorte")
        ) {
          files.push(fullPath);
        }
      }
    }
  }

  await walk(extractedFolder);

  return files.sort();
}

function guessYearFromFile(filePath) {
  const fileName = path.basename(filePath);
  const folderName = path.basename(path.dirname(filePath));
  const parentFolderName = path.basename(path.dirname(path.dirname(filePath)));

  // Important:
  // Do NOT search the full file path because your project folder has "DBW SS2026".
  // Search only file/folder names near the accident file.
  const text = `${fileName} ${folderName} ${parentFolderName}`;

  const match = text.match(/20(16|17|18|19|20|21|22|23|24)/);

  if (!match) {
    throw new Error(`Could not detect accident year from file: ${filePath}`);
  }

  return Number(match[0]);
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