const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const BaseExtractor = require("../baseextractor");

const SOURCE = {
  code: "genesis",
  name: "GENESIS Destatis",
  provider: "Destatis",
  portalUrl: "https://www-genesis.destatis.de/datenbank/online",
  apiUrl: "https://www-genesis.destatis.de/genesisWS/rest/2020/data/tablefile",
  note: "GENESIS API table download is optional and requires credentials."
};

class Genesis extends BaseExtractor {
  constructor(downloader) {
    super(downloader, SOURCE);
  }

  hasCredentials() {
    return Boolean(process.env.GENESIS_USERNAME && process.env.GENESIS_PASSWORD);
  }

  getTableCodes() {
    const value = process.env.GENESIS_TABLES;

    if (!value) {
      return [];
    }

    return value
      .split(",")
      .map(code => code.trim())
      .filter(code => code.length > 0);
  }

  async downloadPortalPage(force = false) {
    this.log("Downloading GENESIS portal page as metadata");

    return this.downloader.download(
      this.source.portalUrl,
      "genesis_portal_page.html",
      {
        force,
        folder: this.downloader.metadataFolder,
        timeout: 120000
      }
    );
  }

  async downloadTable(tableCode) {
    this.log(`Trying GENESIS API table download: ${tableCode}`);

    const params = new URLSearchParams({
      username: process.env.GENESIS_USERNAME,
      password: process.env.GENESIS_PASSWORD,
      name: tableCode,
      area: "all",
      format: "csv",
      language: "de"
    });

    const response = await axios.post(this.source.apiUrl, params.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0",
        "Accept": "text/csv,text/plain,*/*"
      },
      responseType: "stream",
      timeout: 120000,
      validateStatus: status => status >= 200 && status < 300
    });

    const filename = `genesis_${tableCode}.csv`;
    const filePath = path.join(this.downloader.downloadsFolder, filename);
    const tempPath = `${filePath}.part`;

    await fs.remove(tempPath);

    const writer = fs.createWriteStream(tempPath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
      response.data.on("error", reject);
    });

    await fs.move(tempPath, filePath, { overwrite: true });

    const info = await this.downloader.fileInfo(filePath);

    return {
      status: "downloaded",
      sourceUrl: this.source.apiUrl,
      tableCode,
      downloadedAt: new Date().toISOString(),
      ...info
    };
  }

  async downloadAll(force = false) {
    const sourceReferenceFile = await this.saveSourceReference({
      purpose:
        "Save GENESIS portal metadata. Optional API tables can be downloaded if credentials and table codes are provided."
    });

    const portalPage = await this.downloadPortalPage(force);

    const tableCodes = this.getTableCodes();
    const tableDownloads = [];
    const errors = [];

    if (!this.hasCredentials()) {
      this.log("No GENESIS credentials found. Skipping API table download.");
    } else if (tableCodes.length === 0) {
      this.log("GENESIS credentials found, but no GENESIS_TABLES value provided.");
    } else {
      for (const tableCode of tableCodes) {
        try {
          const result = await this.downloadTable(tableCode);
          tableDownloads.push(result);
        } catch (err) {
          errors.push({
            tableCode,
            status: "failed",
            error: err.message
          });
        }
      }
    }

    return {
      sourceCode: this.sourceCode,
      sourceName: this.sourceName,
      sourceReferenceFile,
      portalPage,
      apiDownloadEnabled: this.hasCredentials(),
      requestedTables: tableCodes,
      downloadedTableCount: tableDownloads.length,
      failedTableCount: errors.length,
      tableDownloads,
      errors
    };
  }
}

module.exports = Genesis;