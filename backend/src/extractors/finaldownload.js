const Downloader = require("../../downloader");

const Unfallatlas = require("./unfallatlas");
const GVISys = require("./gvisys");
const SimplePageExtractor = require("./simplepageextractor");

/*
  GovData is used as metadata/provenance source.

  Important:
  GovData is NOT used to download accident ZIP files here.
  Unfallatlas already downloads the real accident datasets.
*/
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

/*
  Regionalatlas is saved as a reference/metadata page.

  Important:
  The real region/municipality dataset comes from GV-ISys.
*/
const REGIONALATLAS_SOURCE = {
  code: "regionalatlas",
  name: "Regionalatlas",
  provider: "Statistische Ämter des Bundes und der Länder",
  url: "https://regionalatlas.statistikportal.de/"
};

/*
  GENESIS Destatis.

  Problem before:
  Direct GENESIS app URL was timing out:
  https://www-genesis.destatis.de/datenbank/online

  Fix:
  Download a more stable Destatis information page as metadata.
  Keep the real GENESIS portal URL inside portalUrl for documentation.
*/
const GENESIS_SOURCE = {
  code: "genesis",
  name: "GENESIS Destatis",
  provider: "Destatis",

  // Stable metadata/reference page to download
  url: "https://www.destatis.de/DE/Service/OpenData/genesis-api-webservice-oberflaeche.html",

  // Real GENESIS portal, kept only as metadata/provenance information
  portalUrl: "https://www-genesis.destatis.de/datenbank/online"
};

/*
  Sachsen GENESIS.

  Problem before:
  Old wrong domain:
  https://www-statistik.sachsen.de/genonline/online

  Fix:
  Correct domain uses a dot after www:
  https://www.statistik.sachsen.de/genonline/online
*/
const SACHSEN_GENESIS_SOURCE = {
  code: "sachsen_genesis",
  name: "Sachsen GENESIS",
  provider: "Statistisches Landesamt Sachsen",
  url: "https://www.statistik.sachsen.de/genonline/online"
};

async function downloadAllSources(options = {}) {
  /*
    force = true:
    Download files again, even if they already exist.

    force = false:
    Use cached files if they already exist.
  */
  const force = options.force === true;

  /*
    Default data folder:
    backend/data/
  */
  const dataFolder = options.dataFolder || "./data";

  const startedAt = new Date().toISOString();

  /*
    Create one shared downloader object.

    All extractors use this same downloader.
  */
  const downloader = new Downloader(dataFolder);

  /*
    These are all extractors for Step 1.

    Core datasets:
    1. Unfallatlas
    2. GV-ISys

    Metadata/reference pages:
    3. GovData
    4. Regionalatlas
    5. GENESIS
    6. Sachsen GENESIS
  */
  const extractors = [
    new Unfallatlas(downloader),
    new GVISys(downloader),

    /*
      SimplePageExtractor is used for simple metadata/reference pages.
      It saves webpages into data/metadata/.
    */
    new SimplePageExtractor(downloader, GOVDATA_SOURCE, GOVDATA_URLS),
    new SimplePageExtractor(downloader, REGIONALATLAS_SOURCE),
    new SimplePageExtractor(downloader, GENESIS_SOURCE),
    new SimplePageExtractor(downloader, SACHSEN_GENESIS_SOURCE)
  ];

  const results = {};

  /*
    Run every extractor one by one.

    If one optional source fails, the whole project should not crash.
    The error is saved in the manifest instead.
  */
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

  /*
    Manifest explains what was downloaded and where files are stored.
    This is important for reproducibility.
  */
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
        unfallatlas: "Main traffic accident event data. Downloads yearly ZIP files and extracts them.",
        gvisys: "Official municipality/register data. Used later for regions, official keys, and population/regional structure."
      },

      metadataSources: {
        govdata: "Open-data catalog metadata/provenance pages.",
        regionalatlas: "Official regional statistics reference portal page.",
        genesis: "Destatis GENESIS metadata/reference page. Direct API download is optional and not required in Step 1.",
        sachsen_genesis: "Saxony-specific GENESIS/statistics reference page. Optional metadata source."
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

  /*
    Save manifest file:
    data/manifest/download_manifest.json
  */
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