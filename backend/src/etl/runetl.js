const path = require("path");

const db = require("../db/db");

const { parseGVISysExcel } = require("./parsers/gvisysParser");
const { transformGVISysRows } = require("./transformers/regionTransformer");
const {
  insertRegions,
  updateRegionParents,
  getRegionMap
} = require("./loaders/regionLoader");

const {
  findAccidentFiles,
  parseAccidentFile,
  guessYearFromFile
} = require("./parsers/unfallatlasParser");

const { transformAccidentRow } = require("./transformers/accidentTransformer");
const { insertAccidents } = require("./loaders/accidentLoader");

const {
  startImportRun,
  finishImportRun,
  saveSourceFile
} = require("./loaders/provenanceLoader");

const { seedIndicators } = require("./loaders/indicatorLoader");
const { buildIndicators } = require("./aggregators/indicatorAggregator");

async function runEtl() {
  const importRunId = await startImportRun("Full ETL import from downloaded raw files");

  let regionCount = 0;
  let accidentFileCount = 0;
  let accidentRowCount = 0;

  try {
    console.log("======================================");
    console.log("ETL STARTED");
    console.log("Import run ID:", importRunId);
    console.log("======================================");

    const dataFolder = path.join(__dirname, "../../data");

    const gvisysFile = path.join(
      dataFolder,
      "downloads",
      "31122024_Auszug_GV.xlsx"
    );

    const extractedFolder = path.join(dataFolder, "extracted");

    // 1. Parse GV-ISys Excel
    console.log("Reading GV-ISys Excel file...");
    const gvisysRows = parseGVISysExcel(gvisysFile);

    // 2. Normalize regions
    console.log("Normalizing region data...");
    const regions = transformGVISysRows(gvisysRows);
    regionCount = regions.length;

    // 3. Save regions into database
    console.log(`Saving ${regionCount} regions into database...`);
    await insertRegions(regions);
    await updateRegionParents();

    // 4. Get region map for accident loading
    const regionMap = await getRegionMap();

    // 5. Find Unfallatlas accident files
    console.log("Finding Unfallatlas files...");
    const accidentFiles = await findAccidentFiles(extractedFolder);
    accidentFileCount = accidentFiles.length;

    // 6. Parse, normalize, and save accidents
    for (const filePath of accidentFiles) {
      const year = guessYearFromFile(filePath);

      console.log("--------------------------------------");
      console.log(`Processing file: ${filePath}`);
      console.log(`Detected year: ${year}`);

      const sourceFileId = await saveSourceFile(
        importRunId,
        filePath,
        "Unfallatlas",
        year
      );

      const rows = await parseAccidentFile(filePath);

      const accidents = rows.map((row, index) =>
        transformAccidentRow(row, {
          year,
          filePath,
          rowNumber: index + 1,
          sourceFileId,
          importRunId,
          regionMap
        })
      );

      console.log(`Saving ${accidents.length} accidents into database...`);
      await insertAccidents(accidents);

      accidentRowCount += accidents.length;
    }

    // 7. Save indicator definitions
    console.log("Saving indicator definitions...");
    await seedIndicators();

    // 8. Create aggregated indicator values
    console.log("Calculating aggregated indicators...");
    await buildIndicators(importRunId);

    await finishImportRun(importRunId, "success");

    console.log("======================================");
    console.log("COMPLETE: DATA SAVED INTO DATABASE SUCCESSFULLY");
    console.log("======================================");

    return {
      status: "success",
      message: "Complete: data saved into database successfully.",
      importRunId,
      saved: {
        regions: regionCount,
        accidentFiles: accidentFileCount,
        accidentRows: accidentRowCount
      }
    };
  } catch (err) {
    await finishImportRun(importRunId, "failed");

    console.error("======================================");
    console.error("ETL FAILED");
    console.error(err.message);
    console.error("======================================");

    return {
      status: "failed",
      message: "ETL failed. Data was not completely saved.",
      importRunId,
      error: err.message
    };
  }
}

// This allows server.js to use runEtl()
module.exports = {
  runEtl
};

// This allows terminal command: node src/etl/runEtl.js
if (require.main === module) {
  runEtl()
    .then(result => {
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.status === "success" ? 0 : 1);
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}