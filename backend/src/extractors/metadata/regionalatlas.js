const BaseExtractor = require("./baseextractor");

const SOURCE = {
  code: "regionalatlas",
  name: "Regionalatlas",
  provider: "Statistische Ämter des Bundes und der Länder",
  url: "https://regionalatlas.statistikportal.de/",
  note: "Regionalatlas is saved as a reference page. Main region data comes from GV-ISys."
};

class Regionalatlas extends BaseExtractor {
  constructor(downloader) {
    super(downloader, SOURCE);
  }

  async downloadAll(force = false) {
    const sourceReferenceFile = await this.saveSourceReference({
      purpose:
        "Save Regionalatlas page as an official reference source. No raw statistical table is parsed in Step 1."
    });

    this.log("Downloading Regionalatlas reference page");

    const download = await this.downloader.download(
      this.source.url,
      "regionalatlas_homepage.html",
      {
        force,
        folder: this.downloader.metadataFolder,
        timeout: 60000
      }
    );

    return {
      sourceCode: this.sourceCode,
      sourceName: this.sourceName,
      sourceReferenceFile,
      downloadedCount: download.status === "failed" ? 0 : 1,
      failedCount: download.status === "failed" ? 1 : 0,
      pages: [
        {
          sourceCode: this.sourceCode,
          sourceName: this.sourceName,
          originalSourceUrl: this.source.url,
          download
        }
      ],
      errors: download.status === "failed" ? [download] : []
    };
  }
}

module.exports = Regionalatlas;