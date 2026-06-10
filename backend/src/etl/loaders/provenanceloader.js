const path = require("path");
const crypto = require("crypto");
const fs = require("fs-extra");
const db = require("../../db/db");

async function sha256(filePath) {
  const hash = crypto.createHash("sha256");
  const stream = fs.createReadStream(filePath);

  await new Promise((resolve, reject) => {
    stream.on("data", chunk => hash.update(chunk));
    stream.on("end", resolve);
    stream.on("error", reject);
  });

  return hash.digest("hex");
}

async function startImportRun(notes = "") {
  const result = await db.query(
    "INSERT INTO import_runs (status, notes) VALUES ($1, $2) RETURNING import_run_id",
    ["running", notes]
  );

  return result.rows[0].import_run_id;
}

async function finishImportRun(importRunId, status = "success") {
  await db.query(
    "UPDATE import_runs SET finished_at = NOW(), status = $1 WHERE import_run_id = $2",
    [status, importRunId]
  );
}

async function saveSourceFile(importRunId, filePath, sourceSystem, datasetYear = null, sourceUrl = null) {
  const checksum = await sha256(filePath);

  const result = await db.query(
    `
    INSERT INTO source_files
      (import_run_id, source_system, source_url, file_path, file_name, dataset_year, sha256)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7)
    RETURNING source_file_id
    `,
    [
      importRunId,
      sourceSystem,
      sourceUrl,
      filePath,
      path.basename(filePath),
      datasetYear,
      checksum
    ]
  );

  return result.rows[0].source_file_id;
}

module.exports = {
  startImportRun,
  finishImportRun,
  saveSourceFile
};