const Downloader = require("../../downloader");

const Unfallatlas = require("./core/unfallatlas");
const GVISys = require("./core/gvisys");
const RegionalAtlas = require("./core/regionalatlas");

const SimplePageExtractor = require("./simplepageextractor");

const GOVDATA_SOURCE = {
  code: "govdata",
  name: "GovData traffic accident metadata",
  provider: "GovData"
};

const GOVDATA_URLS = [
  "https://www.govdata.de/suche?tags=str%C3%A4%C3%9Fenverkehrsunf%C3%A4lle",
  "https://www.govdata.de/suche/daten/verkehrsunfaelleb862c",
  "https://www.govdata.de/suche/daten/unfallatlas"
];

const GENESIS_SOURCE = {
  code: "genesis",
  name: "GENESIS Destatis",
  provider: "Destatis",
  url: "https://www.destatis.de/DE/Service/OpenData/genesis-api-webservice-oberflaeche.html",
  portalUrl: "https://www-genesis.destatis.de/datenbank/online"
};

const SACHSEN_GENESIS_SOURCE = {
  code: "sachsen_genesis",
  name: "Sachsen GENESIS",
  provider: "Statistisches Landesamt Sachsen",
  url: "https://www.statistik.sachsen.de/genonline/online"
};

async function downloadAllSources(options = {}) {
  const force = options.force === true;
  const dataFolder = options.dataFolder || "./data";

  const startedAt = new Date().toISOString();

  const downloader = new Downloader(dataFolder);

  const extractors = [
    new Unfallatlas(downloader),
    new GVISys(downloader),
    new RegionalAtlas(downloader),

    new SimplePageExtractor(downloader, GOVDATA_SOURCE, GOVDATA_URLS),
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
      },

      metadataSources: {
        govdata:
          "Open-data catalog metadata/provenance pages for traffic accident datasets.",

        genesis:
          "Destatis GENESIS metadata/reference page. Used for documentation and provenance.",

        sachsen_genesis:
          "Saxony-specific GENESIS/statistics reference page. Used as optional metadata/provenance source."
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