const BaseExtractor = require("./baseextractor");

const SOURCE = {
  code: "sachsen_genesis",
  name: "Sachsen GENESIS",
  provider: "Statistisches Landesamt Sachsen",
  url: "https://www.statistik.sachsen.de/genonline/online",
  note: "Sachsen GENESIS is saved as a reference page. It is optional for Step 1."
};

class SachsenGenesis extends BaseExtractor {
  constructor(downloader) {
    super(downloader, SOURCE);
  }

  async downloadAll(force = false) {
    const sourceReferenceFile = await this.saveSourceReference({
      purpose:
        "Save Sachsen GENESIS portal page as optional metadata/reference source."
    });

    this.log("Downloading Sachsen GENESIS reference page");

    const download = await this.downloader.download(
      this.source.url,
      "sachsen_genesis_portal_page.html",
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

module.exports = SachsenGenesis;