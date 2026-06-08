const axios = require("axios");
const cheerio = require("cheerio");
const BaseExtractor = require("./baseextractor");

const START_YEAR = 2016;

const SOURCE = {
  code: "unfallatlas",
  name: "Unfallatlas",
  provider: "Statistische Ämter des Bundes und der Länder / OpenGeodata NRW",
  baseUrl: "https://www.opengeodata.nrw.de/produkte/transport_verkehr/unfallatlas/",
  indexJsonUrl: "https://www.opengeodata.nrw.de/produkte/transport_verkehr/unfallatlas/index.json",
  documentationPdfUrl: "https://www.opengeodata.nrw.de/produkte/transport_verkehr/unfallatlas/DSB_Unfallatlas.pdf",
  portalUrl: "https://unfallatlas.statistikportal.de/"
};

class Unfallatlas extends BaseExtractor {
  constructor(downloader) {
    super(downloader, SOURCE);
  }

  async listFromJsonIndex() {
    this.log(`Reading official JSON index: ${this.source.indexJsonUrl}`);

    const response = await axios.get(this.source.indexJsonUrl, {
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json,text/plain,*/*"
      }
    });

    const files = [];

    for (const dataset of response.data.datasets || []) {
      for (const file of dataset.files || []) {
        const filename = file.name;
        if (!filename) continue;

        const match = filename.match(/Unfallorte(\d{4})_EPSG25832_CSV\.zip/i);
        if (!match) continue;

        const year = Number(match[1]);
        if (year < START_YEAR) continue;

        files.push({
          year,
          filename,
          sourceUrl: new URL(filename, this.source.baseUrl).toString(),
          discoveredFrom: this.source.indexJsonUrl,
          sourceTimestamp: file.timestamp || null,
          sourceSize: file.size || null
        });
      }
    }

    files.sort((a, b) => a.year - b.year);

    if (files.length === 0) {
      throw new Error("No Unfallatlas CSV ZIP files found in JSON index.");
    }

    return files;
  }

  async listFromHtmlFallback() {
    this.log(`Reading official HTML fallback: ${this.source.baseUrl}`);

    const response = await axios.get(this.source.baseUrl, {
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "text/html,*/*"
      }
    });

    const $ = cheerio.load(response.data);
    const files = [];

    $("a").each((_, el) => {
      const href = $(el).attr("href");
      if (!href) return;

      const decoded = decodeURIComponent(href);
      const match = decoded.match(/Unfallorte(\d{4})_EPSG25832_CSV\.zip/i);
      if (!match) return;

      const year = Number(match[1]);
      if (year < START_YEAR) return;

      const filename = decoded.split("/").pop();

      if (!files.find(file => file.year === year)) {
        files.push({
          year,
          filename,
          sourceUrl: new URL(decoded, this.source.baseUrl).toString(),
          discoveredFrom: this.source.baseUrl
        });
      }
    });

    files.sort((a, b) => a.year - b.year);

    if (files.length === 0) {
      throw new Error("No Unfallatlas CSV ZIP files found in HTML fallback.");
    }

    return files;
  }

  async listDatasets() {
    try {
      return await this.listFromJsonIndex();
    } catch (err) {
      this.error(`JSON index failed: ${err.message}`);
      return this.listFromHtmlFallback();
    }
  }

  async downloadAll(force = false) {
    const sourceReferenceFile = await this.saveSourceReference({
      reproducibilityNote:
        "Unfallatlas files are discovered from the official source and downloaded as unchanged raw ZIP files."
    });

    const discoveredFiles = await this.listDatasets();

    const files = [];
    const errors = [];

    for (const file of discoveredFiles) {
      const download = await this.downloader.download(file.sourceUrl, file.filename, { force });

      let extraction = null;

      if (download.status !== "failed" && download.filePath.endsWith(".zip")) {
        extraction = this.downloader.unzip(download.filePath);
      }

      const record = {
        sourceCode: this.sourceCode,
        sourceName: this.sourceName,
        year: file.year,
        discoveredFrom: file.discoveredFrom,
        originalSourceUrl: file.sourceUrl,
        sourceTimestamp: file.sourceTimestamp || null,
        sourceSize: file.sourceSize || null,
        download,
        extraction
      };

      files.push(record);

      if (download.status === "failed") {
        errors.push(record);
      }
    }

    const documentation = await this.downloader.download(
      this.source.documentationPdfUrl,
      "DSB_Unfallatlas.pdf",
      { force }
    );

    const portalReference = await this.downloader.download(
      this.source.portalUrl,
      "unfallatlas_statistikportal_homepage.html",
      {
        force,
        folder: this.downloader.metadataFolder
      }
    );

    return {
      sourceCode: this.sourceCode,
      sourceName: this.sourceName,
      sourceReferenceFile,
      discoveredCount: discoveredFiles.length,
      downloadedCount: files.filter(f => f.download.status !== "failed").length,
      failedCount: errors.length,
      years: files.map(f => f.year),
      files,
      documentation,
      portalReference,
      errors
    };
  }
}

module.exports = Unfallatlas;