const path = require("path");
const fs = require("fs-extra");

const { parseGVISysExcel } = require("./parsers/gvisysparser");
const { transformGVISysRows } = require("./transformers/regiontransformer");

const {
  insertRegions,
  updateRegionParents,
  getRegionMap
} = require("./loaders/regionloader");

const {
  findAccidentFiles,
  parseAccidentFile,
  guessYearFromFile
} = require("./parsers/unfallatlasparser");

const { transformAccidentRow } = require("./transformers/accidenttransformer");
const { insertAccidents } = require("./loaders/accidentloader");

const {
  startImportRun,
  finishImportRun,
  saveSourceFile
} = require("./loaders/provenanceloader");

const { seedIndicators } = require("./loaders/indicatorloader");
const { buildIndicators } = require("./aggregators/indicatoraggregator");

const { parseRegionalAtlasCsv } = require("./parsers/regionalatlasparser");
const { transformRegionalAtlasRows } = require("./transformers/regionalatlastransformer");

const {
  insertRegionalAtlasValues,
  updateRegionPopulationFromIndicator
} = require("./loaders/regionalatlasloader");

async function loadRegionalAtlasData(dataFolder, regionMap, importRunId) {
  console.log("Reading Regionalatlas / Regionalstatistik CSV files...");

  const regionalAtlasFiles = [
    {
      filePath: path.join(
        dataFolder,
        "downloads",
        "regionalatlas_46241-01-04-4_traffic_accidents_districts.csv"
      ),
      indicatorCode: "regional_traffic_accidents_districts",
      indicatorName: "Traffic accidents - districts/cities",
      unit: "count",
      preferTotalRows: true
    },
    {
      filePath: path.join(
        dataFolder,
        "downloads",
        "regionalatlas_46241-01-04-5_traffic_accidents_municipalities.csv"
      ),
      indicatorCode: "regional_traffic_accidents_municipalities",
      indicatorName: "Traffic accidents - municipalities",
      unit: "count",
      preferTotalRows: true
    },
    {
      filePath: path.join(
        dataFolder,
        "downloads",
        "regionalatlas_12411-01-01-4_population_districts.csv"
      ),
      indicatorCode: "population_districts",
      indicatorName: "Population - districts/cities",
      unit: "persons",
      preferTotalRows: true
    },
    {
      filePath: path.join(
        dataFolder,
        "downloads",
        "regionalatlas_12411-01-01-5_population_municipalities.csv"
      ),
      indicatorCode: "population_municipalities",
      indicatorName: "Population - municipalities",
      unit: "persons",
      preferTotalRows: true
    },
    {
      filePath: path.join(
        dataFolder,
        "downloads",
        "regionalatlas_11111-01-01-4_area_districts.csv"
      ),
      indicatorCode: "area_km2_districts",
      indicatorName: "Area in km² - districts/cities",
      unit: "km2",
      preferTotalRows: false
    },
    {
      filePath: path.join(
        dataFolder,
        "downloads",
        "regionalatlas_11111-01-01-5_area_municipalities.csv"
      ),
      indicatorCode: "area_km2_municipalities",
      indicatorName: "Area in km² - municipalities",
      unit: "km2",
      preferTotalRows: false
    },
    {
      filePath: path.join(
        dataFolder,
        "downloads",
        "regionalatlas_46251-01-03-4_vehicle_stock_districts.csv"
      ),
      indicatorCode: "vehicle_stock_districts",
      indicatorName: "Vehicle stock - districts/cities",
      unit: "vehicles",
      preferTotalRows: true
    },
    {
      filePath: path.join(
        dataFolder,
        "downloads",
        "regionalatlas_46251-02-01-4_passenger_cars_districts.csv"
      ),
      indicatorCode: "passenger_cars_districts",
      indicatorName: "Passenger cars - districts/cities",
      unit: "cars",
      preferTotalRows: true
    }
  ];

  let totalSavedValues = 0;

  for (const file of regionalAtlasFiles) {
    if (!await fs.pathExists(file.filePath)) {
      console.log("Regionalatlas file not found, skipping:");
      console.log(file.filePath);
      continue;
    }

    console.log("--------------------------------------");
    console.log("Parsing Regionalatlas file:");
    console.log(file.filePath);

    await saveSourceFile(
      importRunId,
      file.filePath,
      "Regionalatlas / Regionalstatistik GENESIS",
      null
    );

    const rows = await parseRegionalAtlasCsv(file.filePath);

    console.log("Regionalatlas raw row count:", rows.length);

    const values = transformRegionalAtlasRows(rows, {
      regionMap,
      indicatorCode: file.indicatorCode,
      indicatorName: file.indicatorName,
      unit: file.unit,
      preferTotalRows: file.preferTotalRows
    });

    await insertRegionalAtlasValues(values, importRunId);

    totalSavedValues += values.length;

    console.log(`Saved ${values.length} Regionalatlas indicator values.`);
  }

  await updateRegionPopulationFromIndicator("population_municipalities");
  await updateRegionPopulationFromIndicator("population_districts");

  return totalSavedValues;
}

async function runEtl() {
  const importRunId = await startImportRun(
    "Full ETL import from downloaded raw files"
  );

  let regionCount = 0;
  let regionalAtlasValueCount = 0;
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

    console.log("Reading GV-ISys Excel file...");
    const gvisysRows = parseGVISysExcel(gvisysFile);

    console.log("GV-ISys raw row count:", gvisysRows.length);

    if (gvisysRows.length > 0) {
      console.log("GV-ISys first row:");
      console.log(gvisysRows[0]);

      console.log("GV-ISys column names:");
      console.log(Object.keys(gvisysRows[0]));
    }

    console.log("Normalizing region data...");
    const regions = transformGVISysRows(gvisysRows);
    regionCount = regions.length;

    console.log(`Saving ${regionCount} regions into database...`);

    if (regionCount === 0) {
      throw new Error(
        "GV-ISys region parsing returned 0 regions. Check Excel column names printed above."
      );
    }

    await insertRegions(regions);
    await updateRegionParents();

    const regionMap = await getRegionMap();

    regionalAtlasValueCount = await loadRegionalAtlasData(
      dataFolder,
      regionMap,
      importRunId
    );

    console.log("Finding Unfallatlas files...");
    const accidentFiles = await findAccidentFiles(extractedFolder);
    accidentFileCount = accidentFiles.length;

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

    console.log("Saving indicator definitions...");
    await seedIndicators();

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
        regionalAtlasValues: regionalAtlasValueCount,
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

module.exports = {
  runEtl
};

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