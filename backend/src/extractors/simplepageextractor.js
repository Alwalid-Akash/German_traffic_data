const BaseExtractor = require("./baseextractor");

/*
  SimplePageExtractor is used for sources that are only webpages.

  Examples:
  - GovData pages
  - Regionalatlas homepage
  - GENESIS reference page
  - Sachsen GENESIS page

  These pages are saved into:
  data/metadata/

  They are not parsed or transformed in Step 1.
*/
class SimplePageExtractor extends BaseExtractor {
  constructor(downloader, source, urls = []) {
    super(downloader, source);

    /*
      Some sources have multiple URLs, like GovData.
      Some sources have only one URL, like Regionalatlas.

      If urls array is provided, use that.
      Otherwise, use source.url.
    */
    this.urls = urls.length > 0 ? urls : [source.url];
  }

  async downloadAll(force = false) {
    /*
      Save source metadata as JSON.

      Example:
      data/metadata/genesis_source_reference.json
    */
    const sourceReferenceFile = await this.saveSourceReference({
      note:
        "This source is saved as an official metadata/reference page during Step 1. No parsing or transformation is performed."
    });

    const pages = [];
    const errors = [];

    /*
      Download every URL for this source.
    */
    for (let i = 0; i < this.urls.length; i++) {
      const url = this.urls[i];

      /*
        File names will look like:

        govdata_page_1.html
        govdata_page_2.html
        regionalatlas_page_1.html
        genesis_page_1.html
        sachsen_genesis_page_1.html
      */
      const filename = `${this.sourceCode}_page_${i + 1}.html`;

      this.log(`Downloading metadata/reference page: ${url}`);

      /*
        These pages are optional metadata pages.

        Important fix:
        timeout: 30000
          Wait maximum 30 seconds.

        maxRetries: 1
          Try only once.

        Why?
        Optional metadata pages should not block important downloads like:
        - Unfallatlas ZIP files
        - GV-ISys XLSX file
      */
      const download = await this.downloader.download(url, filename, {
        force,
        folder: this.downloader.metadataFolder,
        timeout: 30000,
        maxRetries: 1
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

module.exports = SimplePageExtractor;