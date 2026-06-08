const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const BaseExtractor = require("./baseextractor");
require("dotenv").config();

class Genesis extends BaseExtractor {
  constructor(downloader) {
    super(downloader, "Genesis");
  }

  async downloadTable(tableCode = "46241-0001", force = false) {
    const url = "https://www-genesis.destatis.de/genesisWS/rest/2020/data/tablefile";

    const username = process.env.GENESIS_USERNAME || "GAST";
    const password = process.env.GENESIS_PASSWORD || "GAST";

    const params = new URLSearchParams({
      username,
      password,
      name: tableCode,
      area: "all",
      format: "csv",
      language: "de",
      startyear: "2018",
      endyear: new Date().getFullYear().toString(),
    });

    this.log(`Requesting table ${tableCode} via POST...`);

    const response = await axios.post(url, params.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0",
        "Accept": "text/csv,text/plain,application/octet-stream,*/*",
      },
      responseType: "stream",
      timeout: 60000,
      validateStatus: status => status >= 200 && status < 300,
    });

    const filename = `genesis_${tableCode}.csv`;
    const filePath = path.join(this.downloader.downloadsFolder, filename);

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
      response.data.on("error", reject);
    });

    this.log(`Saved: ${filePath}`);
    return { source: this.sourceName, tableCode, filePath };
  }

  async downloadAll(force = false) {
    try {
      const result = await this.downloadTable("46241-0001", force);
      return { source: this.sourceName, success: true, ...result };
    } catch (err) {
      this.error(`Failed: ${err.message}`);
      return { source: this.sourceName, success: false, error: err.message };
    }
  }
}

module.exports = Genesis;