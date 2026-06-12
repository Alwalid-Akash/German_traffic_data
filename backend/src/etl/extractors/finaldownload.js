const Downloader = require("../../../downloader");

const Unfallatlas = require("./core/unfallatlas");
const GVISys = require("./core/gvisys");
const RegionalAtlas = require("./core/regionalatlas");

async function downloadAllSources(options = {}) {
  const force = options.force === true;
  const dataFolder = options.dataFolder || "./data";

  const startedAt = new Date().toISOString();

  const downloader = new Downloader(dataFolder);

  const extractors = [
    new Unfallatlas(downloader),
    new GVISys(downloader),
    new RegionalAtlas(downloader)
  ];

  const results = {};

  for (const extractor of extractors) {
    console.log("\n" + "=".repeat(70));
    console.log(`REPRODUCIBLE DOWNLOAD: ${extractor.sourceCode.toUpperCase()}`);
    console.log("=".repeat(70));

    try {
      results[extractor.sourceCode] = await extractor.downloadAll(force);
    } catch (err) {
      results[extractor.sourceCode] = {
        sourceCode: extractor.sourceCode,
        sourceName: extractor.sourceName,
        status: "failed",
        error: err.message
      };
    }
  }

  const finishedAt = new Date().toISOString();

  const manifest = {
    project: "German Traffic Accident Analytics",
    step: "Step 1 - Reproducible Raw Dataset Download",
    force,
    startedAt,
    finishedAt,

    folders: {
      dataFolder: downloader.dataFolder,
      downloadsFolder: downloader.downloadsFolder,
      extractedFolder: downloader.extractedFolder,
      metadataFolder: downloader.metadataFolder,
      manifestFolder: downloader.manifestFolder
    },

    sources: results,

    sourceRoles: {
      coreDatasets: {
        unfallatlas:
          "Main traffic accident event dataset. Downloads yearly Unfallatlas accident files and extracts them.",

        gvisys:
          "Official municipality and regional reference dataset. Used for AGS codes, region names, and administrative hierarchy.",

        regionalatlas:
          "Core Regionalatlas / Regionalstatistik GENESIS statistical dataset. Used as an actual data source for traffic accident statistics, population, area, vehicle stock, and passenger car indicators."
      }
    },

    reproducibility: {
      rawFilesSavedUnchanged: true,
      checksumAlgorithm: "SHA-256",
      manifestGenerated: true,
      transformPerformed: false,
      databaseLoadPerformed: false,
      schemaCreated: false
    }
  };

  const manifestFile = await downloader.saveManifest(
    "download_manifest.json",
    manifest
  );

  manifest.manifestFile = manifestFile;

  return manifest;
}

module.exports = {
  downloadAllSources
};
