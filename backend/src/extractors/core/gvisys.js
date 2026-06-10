const axios = require("axios");
const cheerio = require("cheerio");
const BaseExtractor = require("../baseextractor");

const SOURCE = {
  code: "gvisys",
  name: "GV-ISys Gemeindeverzeichnis",
  provider: "Destatis",
  mainUrl: "https://www.destatis.de/DE/Themen/Laender-Regionen/Regionales/Gemeindeverzeichnis/_inhalt.html",
  latestArticleUrl: "https://www.destatis.de/DE/Themen/Laender-Regionen/Regionales/Gemeindeverzeichnis/Administrativ/Archiv/GVAuszugJ/31122024_Auszug_GV.html",
  latestXlsxUrl: "https://www.destatis.de/DE/Themen/Laender-Regionen/Regionales/Gemeindeverzeichnis/Administrativ/Archiv/GVAuszugJ/31122024_Auszug_GV.xlsx?__blob=publicationFile&v=2"
};

class GVISys extends BaseExtractor {
  constructor(downloader) {
    super(downloader, SOURCE);
  }

  async discoverXlsxLinks(pageUrl) {
    this.log(`Searching official GV-ISys page: ${pageUrl}`);

    const response = await axios.get(pageUrl, {
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "text/html,*/*"
      }
    });

    const $ = cheerio.load(response.data);
    const links = [];

    $("a").each((_, el) => {
      const href = $(el).attr("href");
      if (!href) return;

      const absoluteUrl = new URL(href, pageUrl).toString();
      const lower = absoluteUrl.toLowerCase();

      if (
        lower.includes("auszug_gv") &&
        (lower.includes(".xlsx") || lower.includes("__blob=publicationfile"))
      ) {
        links.push({
          sourceUrl: absoluteUrl,
          filename: this.filenameFromUrl(absoluteUrl),
          discoveredFrom: pageUrl
        });
      }
    });

    return links;
  }

  filenameFromUrl(url) {
    const combined = decodeURIComponent(url);

    const match = combined.match(/(\d{8})[_-]?Auszug[_-]?GV/i);
    if (match) return `${match[1]}_Auszug_GV.xlsx`;

    try {
      const parsed = new URL(url);
      const base = decodeURIComponent(parsed.pathname.split("/").pop());
      if (base && base.endsWith(".xlsx")) return base;
    } catch (_) { }

    return "gvisys_gemeindeverzeichnis.xlsx";
  }

  uniqueBySourceUrl(items) {
    const seen = new Set();

    return items.filter(item => {
      if (seen.has(item.sourceUrl)) return false;
      seen.add(item.sourceUrl);
      return true;
    });
  }

  async listDatasets() {
    const links = [];

    try {
      links.push(...await this.discoverXlsxLinks(this.source.mainUrl));
    } catch (err) {
      this.error(`Main page discovery failed: ${err.message}`);
    }

    try {
      links.push(...await this.discoverXlsxLinks(this.source.latestArticleUrl));
    } catch (err) {
      this.error(`Latest article discovery failed: ${err.message}`);
    }

    links.push({
      sourceUrl: this.source.latestXlsxUrl,
      filename: "31122024_Auszug_GV.xlsx",
      discoveredFrom: "configured official Destatis GV-ISys fallback URL"
    });

    return this.uniqueBySourceUrl(links);
  }

  async downloadAll(force = false) {
    const sourceReferenceFile = await this.saveSourceReference({
      reproducibilityNote:
        "GV-ISys files are downloaded from official Destatis municipality register pages."
    });

    const mainPage = await this.downloader.download(
      this.source.mainUrl,
      "gvisys_main_page.html",
      {
        force,
        folder: this.downloader.metadataFolder
      }
    );

    const latestPage = await this.downloader.download(
      this.source.latestArticleUrl,
      "gvisys_latest_article_page.html",
      {
        force,
        folder: this.downloader.metadataFolder
      }
    );

    const discoveredFiles = await this.listDatasets();

    const files = [];
    const errors = [];

    for (const file of discoveredFiles) {
      const download = await this.downloader.download(
        file.sourceUrl,
        file.filename,
        { force }
      );

      const record = {
        sourceCode: this.sourceCode,
        sourceName: this.sourceName,
        discoveredFrom: file.discoveredFrom,
        originalSourceUrl: file.sourceUrl,
        download
      };

      files.push(record);

      if (download.status === "failed") {
        errors.push(record);
      }
    }

    return {
      sourceCode: this.sourceCode,
      sourceName: this.sourceName,
      sourceReferenceFile,
      sourcePages: {
        mainPage,
        latestPage
      },
      discoveredCount: discoveredFiles.length,
      downloadedCount: files.filter(f => f.download.status !== "failed").length,
      failedCount: errors.length,
      files,
      errors
    };
  }
}

module.exports = GVISys;