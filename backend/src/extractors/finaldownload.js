const Downloader = require("../../downloader");

const Unfallatlas = require("./unfallatlas");
const GVISys = require("./gvisys");
const SimplePageExtractor = require("./simplepageextractor");

const GOVDATA_SOURCE = {
  code: "govdata",
  name: "GovData traffic accident metadata",
  provider: "GovData"
};

const REGIONALATLAS_SOURCE = {
  code: "regionalatlas",
  name: "Regionalatlas",
  provider: "Statistische Ämter des Bundes und der Länder",
  url: "https://regionalatlas.statistikportal.de/"
};

const GENESIS_SOURCE = {
  code: "genesis",
  name: "GENESIS Destatis",
  provider: "Destatis",
  url: "https://www-genesis.destatis.de/datenbank/online"
};

const SACHSEN_GENESIS_SOURCE = {
  code: "sachsen_genesis",
  name: "Sachsen GENESIS",
  provider: "Statistisches Landesamt Sachsen",
  url: "https://www-statistik.sachsen.de/genonline/online"
};

const GOVDATA_URLS = [
  "https://www.govdata.de/suche?tags=str%C3%A4%C3%9Fenverkehrsunf%C3%A4lle",
  "https://www.govdata.de/suche/daten/verkehrsunfaelleb862c",
  "https://www.govdata.de/suche/daten/unfallatlas"
];

async function downloadAllSources(options = {}) {
  const force = options.force === true;
  const dataFolder = options.dataFolder || "./data";

  const startedAt = new Date().toISOString();
  const downloader = new Downloader(dataFolder);

  const extractors = [
    new Unfallatlas(downloader),
    new GVISys(downloader),
    new SimplePageExtractor(downloader, GOVDATA_SOURCE, GOVDATA_URLS),
    new SimplePageExtractor(downloader, REGIONALATLAS_SOURCE),
    new SimplePageExtractor(downloader, GENESIS_SOURCE),
    new SimplePageExtractor(downloader, SACHSEN_GENESIS_SOURCE)
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
    dataFolder: downloader.dataFolder,
    downloadsFolder: downloader.downloadsFolder,
    extractedFolder: downloader.extractedFolder,
    metadataFolder: downloader.metadataFolder,
    manifestFolder: downloader.manifestFolder,
    sources: results,
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