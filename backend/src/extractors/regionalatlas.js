const axios = require("axios");
const BaseExtractor = require("./baseextractor");

class Regionalatlas extends BaseExtractor {
  constructor(downloader) {
    super(downloader, "Regionalatlas");
  }

  async checkAvailability() {
    try {
      await axios.get("https://regionalatlas.statistikportal.de/", { timeout: 10000 });
      return true;
    } catch (err) {
      return false;
    }
  }

  async downloadAll(force = false) {
    const available = await this.checkAvailability();
    if (available) {
      this.log("Website is reachable, but no automated download implemented.");
    } else {
      this.error("Website unreachable.");
    }
    return { source: this.sourceName, available };
  }
}

module.exports = Regionalatlas;