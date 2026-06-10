const BaseExtractor = require("./baseextractor");

const SOURCE = {
  code: "govdata",
  name: "GovData traffic accident metadata",
  provider: "GovData",
  note: "GovData is used as metadata/provenance source, not as the main accident dataset."
};

const GOVDATA_URLS = [
  "https://www.govdata.de/suche?tags=str%C3%A4%C3%9Fenverkehrsunf%C3%A4lle",
  "https://www.govdata.de/suche/daten/verkehrsunfaelleb862c",
  "https://www.govdata.de/suche/daten/unfallatlas"
];

class GovData extends BaseExtractor {
  constructor(downloader) {
    super(downloader, SOURCE);
  }

  async downloadAll(force = false) {
    const sourceReferenceFile = await this.saveSourceReference({
      purpose:
        "Save GovData metadata pages for documentation and provenance. Accident ZIP files are downloaded by Unfallatlas extractor."
    });

    const pages = [];
    const errors = [];

    for (let i = 0; i < GOVDATA_URLS.length; i++) {
      const url = GOVDATA_URLS[i];
      const filename = `govdata_page_${i + 1}.html`;

      this.log(`Downloading GovData metadata page ${i + 1}`);

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
      downloadedCount: pages.filter(page => page.download.status !== "failed").length,
      failedCount: errors.length,
      pages,
      errors
    };
  }
}

module.exports = GovData;