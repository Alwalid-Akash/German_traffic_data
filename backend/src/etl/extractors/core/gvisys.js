const axios = require("axios");
const cheerio = require("cheerio");
const BaseExtractor = require("../baseextractor");

const SOURCE = {
  code: "gvisys",
  name: "GV-ISys Gemeindeverzeichnis",
  provider: "Statistisches Bundesamt Destatis",
  url: "https://www.destatis.de/DE/Themen/Laender-Regionen/Regionales/Gemeindeverzeichnis/_inhalt.html",
  note: "Official German municipality and regional reference dataset. Used for AGS codes, region names, hierarchy, population, and area."
};

const FALLBACK_FILE = {
  code: "31122024_Auszug_GV",
  name: "Alle politisch selbständigen Gemeinden mit ausgewählten Merkmalen am 31.12.2024",
  fileName: "31122024_Auszug_GV.xlsx",
  role: "Main regional reference dataset for the project",
  url: "https://www.destatis.de/DE/Themen/Laender-Regionen/Regionales/Gemeindeverzeichnis/Administrativ/Archiv/GVAuszugJ/31122024_Auszug_GV.xlsx?__blob=publicationFile&v=2",
  datasetDate: "2024-12-31",
  datasetYear: 2024,
  discoveredFrom: "fallback"
};

function parseDatasetDate(fileName) {
  const match = fileName.match(/^(\d{2})(\d{2})(\d{4})_Auszug_GV\.xlsx$/i);

  if (!match) {
    return {
      datasetDate: null,
      datasetYear: null,
      sortKey: 0
    };
  }

  const [, day, month, year] = match;

  return {
    datasetDate: `${year}-${month}-${day}`,
    datasetYear: Number(year),
    sortKey: Number(`${year}${month}${day}`)
  };
}

class GVISys extends BaseExtractor {
  constructor(downloader) {
    super(downloader, SOURCE);
  }

  async listDatasets() {
    this.log(`Reading official GV-ISys page: ${SOURCE.url}`);

    try {
      const response = await axios.get(SOURCE.url, {
        timeout: 30000,
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept": "text/html,*/*"
        }
      });

      const $ = cheerio.load(response.data);
      const files = [];

      $("a").each((_, element) => {
        const href = $(element).attr("href");
        if (!href) return;

        const decodedHref = decodeURIComponent(href);
        const fileNameMatch = decodedHref.match(/(\d{8}_Auszug_GV\.xlsx)/i);
        if (!fileNameMatch) return;

        const fileName = fileNameMatch[1];
        const { datasetDate, datasetYear, sortKey } = parseDatasetDate(fileName);

        files.push({
          code: fileName.replace(/\.xlsx$/i, ""),
          name: `Alle politisch selbständigen Gemeinden mit ausgewählten Merkmalen am ${datasetDate || fileName}`,
          fileName,
          role: "Main regional reference dataset for the project",
          url: new URL(decodedHref, SOURCE.url).toString(),
          datasetDate,
          datasetYear,
          discoveredFrom: SOURCE.url,
          sortKey
        });
      });

      files.sort((a, b) => b.sortKey - a.sortKey);

      if (files.length > 0) {
        return [files[0]];
      }

      this.error("No GV-ISys Excel link found on official page. Using fallback file.");
      return [FALLBACK_FILE];
    } catch (err) {
      this.error(`GV-ISys discovery failed: ${err.message}. Using fallback file.`);
      return [FALLBACK_FILE];
    }
  }

  async downloadAll(force = false) {
    const filesToDownload = await this.listDatasets();

    const sourceReferenceFile = await this.saveSourceReference({
      role: "Core data source",
      note: "The downloader discovers the newest official GV-ISys Auszug_GV Excel file from Destatis. A pinned fallback is used if discovery fails.",
      files: filesToDownload
    });

    const files = [];
    const errors = [];

    for (const file of filesToDownload) {
      this.log(`Downloading GV-ISys file: ${file.name}`);
      console.log(file.url);

      try {
        const download = await this.downloader.download(
          file.url,
          file.fileName,
          {
            force,
            folder: this.downloader.downloadsFolder,
            timeout: 120000,
            maxRetries: 2
          }
        );

        if (download.status === "failed") {
          errors.push({
            status: "failed",
            sourceCode: this.sourceCode,
            sourceName: this.sourceName,
            fileCode: file.code,
            fileName: file.fileName,
            error: download.error
          });

          continue;
        }

        const metadata = {
          sourceCode: this.sourceCode,
          sourceName: this.sourceName,
          provider: SOURCE.provider,
          fileCode: file.code,
          fileName: file.fileName,
          fileTitle: file.name,
          role: file.role,
          sourceUrl: file.url,
          datasetDate: file.datasetDate,
          datasetYear: file.datasetYear,
          download,
          savedAt: new Date().toISOString()
        };

        const metadataPath = await this.downloader.saveMetadata(
          `${this.sourceCode}_${file.code}_metadata.json`,
          metadata
        );

        files.push({
          status: download.status,
          sourceCode: this.sourceCode,
          sourceName: this.sourceName,
          fileCode: file.code,
          fileName: file.fileName,
          fileTitle: file.name,
          role: file.role,
          sourceUrl: file.url,
          datasetDate: file.datasetDate,
          datasetYear: file.datasetYear,
          filePath: download.filePath,
          sha256: download.sha256,
          metadataPath
        });
      } catch (err) {
        errors.push({
          status: "failed",
          sourceCode: this.sourceCode,
          sourceName: this.sourceName,
          fileCode: file.code,
          fileName: file.fileName,
          error: err.message
        });
      }
    }

    return {
      sourceCode: this.sourceCode,
      sourceName: this.sourceName,
      sourceReferenceFile,
      downloadedCount: files.length,
      failedCount: errors.length,
      files,
      errors
    };
  }
}

module.exports = GVISys;
