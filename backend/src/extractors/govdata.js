const BaseExtractor = require("./baseextractor");

// Direct links that are known to work (from NRW open data)
const DATASETS = [
  "https://www.opengeodata.nrw.de/produkte/transport_verkehr/unfallatlas/Unfallorte2024_EPSG25832_CSV.zip",
  "https://www.opengeodata.nrw.de/produkte/transport_verkehr/unfallatlas/Unfallorte2023_EPSG25832_CSV.zip",
];

class GovData extends BaseExtractor {
  constructor(downloader) {
    super(downloader, "GovData");
  }

  async downloadAll(force = false) {
    this.log(`Attempting to download ${DATASETS.length} known accident ZIPs.`);
    const results = [];
    for (const url of DATASETS) {
      try {
        const filename = url.split('/').pop();
        const result = await this.downloadFile(url, filename, force, true);
        results.push({ url, ...result });
      } catch (err) {
        this.error(`Failed ${url}: ${err.message}`);
      }
    }
    return { source: this.sourceName, count: results.length, files: results };
  }
}

module.exports = GovData;