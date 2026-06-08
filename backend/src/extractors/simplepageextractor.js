const BaseExtractor = require("./baseextractor");
class SimplePageExtractor extends BaseExtractor {
  constructor(downloader, source, urls = []) {
    super(downloader, source);
    this.urls = urls.length > 0 ? urls : [source.url];
  }

  async downloadAll(force = false) {
    const sourceReferenceFile = await this.saveSourceReference({
      reproducibilityNote:
        "This source is saved as an official metadata/reference page during Step 1. No parsing or transformation is performed."
    });

    const pages = [];
    const errors = [];

    for (let i = 0; i < this.urls.length; i++) {
      const url = this.urls[i];
      const filename = `${this.sourceCode}_page_${i + 1}.html`;

      const download = await this.downloader.download(url, filename, {
        force,
        folder: this.downloader.metadataFolder
      });

      const record = {
        sourceCode: this.sourceCode,
        sourceName: this.sourceName,
        originalSourceUrl: url,
        download
      };

      pages.push(record);

      if (download.status === "failed") {
        errors.push(record);
      }
    }

    return {
      sourceCode: this.sourceCode,
      sourceName: this.sourceName,
      sourceReferenceFile,
      downloadedCount: pages.filter(p => p.download.status !== "failed").length,
      failedCount: errors.length,
      pages,
      errors
    };
  }
}

module.exports = SimplePageExtractor;