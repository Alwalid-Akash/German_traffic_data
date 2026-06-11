const fs = require("fs-extra");
const csv = require("csv-parser");

async function parseRegionalAtlasCsv(filePath) {
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
  parseRegionalAtlasCsv
};