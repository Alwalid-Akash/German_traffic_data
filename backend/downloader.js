const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const AdmZip = require("adm-zip");
const crypto = require("crypto");

class Downloader {
  constructor(baseFolder = "./data") {
    this.dataFolder = path.resolve(baseFolder);
    this.downloadsFolder = path.join(this.dataFolder, "downloads");
    this.extractedFolder = path.join(this.dataFolder, "extracted");
    this.metadataFolder = path.join(this.dataFolder, "metadata");
    this.manifestFolder = path.join(this.dataFolder, "manifest");

    fs.ensureDirSync(this.downloadsFolder);
    fs.ensureDirSync(this.extractedFolder);
    fs.ensureDirSync(this.metadataFolder);
    fs.ensureDirSync(this.manifestFolder);
  }

  log(message) {
    console.log(`[Downloader] ${message}`);
  }

  safeFilename(filename) {
    return filename
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
      .replace(/\s+/g, "_")
      .slice(0, 180);
  }

  filenameFromUrl(url) {
    const urlObj = new URL(url);
    const filename = decodeURIComponent(path.basename(urlObj.pathname));
    return filename || "download.bin";
  }

  async sha256(filePath) {
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(filePath);

    await new Promise((resolve, reject) => {
      stream.on("data", chunk => hash.update(chunk));
      stream.on("end", resolve);
      stream.on("error", reject);
    });

    return hash.digest("hex");
  }

  async fileInfo(filePath) {
    const stat = await fs.stat(filePath);

    return {
      filePath,
      fileName: path.basename(filePath),
      sizeBytes: stat.size,
      sizeMB: Number((stat.size / 1024 / 1024).toFixed(2)),
      sha256: await this.sha256(filePath)
    };
  }

  async download(url, customFilename, options = {}) {
    const force = options.force === true;
    const folder = options.folder || this.downloadsFolder;
    const maxRetries = options.maxRetries || 3;
    const retryDelay = options.retryDelay || 3000;

    fs.ensureDirSync(folder);

    const filename = this.safeFilename(customFilename || this.filenameFromUrl(url));
    const filePath = path.join(folder, filename);
    const tempPath = `${filePath}.part`;

    const startedAt = new Date().toISOString();

    if (!force && await fs.pathExists(filePath)) {
      const info = await this.fileInfo(filePath);

      this.log(`Already downloaded: ${filename} (${info.sizeMB} MB)`);

      return {
        status: "cached",
        sourceUrl: url,
        downloadedAt: null,
        checkedAt: new Date().toISOString(),
        ...info
      };
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.log(`Downloading: ${filename} (attempt ${attempt}/${maxRetries})`);

        const response = await axios.get(url, {
          responseType: "stream",
          timeout: options.timeout || 300000,
          maxRedirects: 10,
          headers: {
            "User-Agent": "Mozilla/5.0",
            "Accept": "*/*"
          },
          validateStatus: status => status >= 200 && status < 300
        });

        await fs.remove(tempPath);

        const writer = fs.createWriteStream(tempPath);
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
          writer.on("finish", resolve);
          writer.on("error", reject);
          response.data.on("error", reject);
        });

        const tempStat = await fs.stat(tempPath);

        if (tempStat.size === 0) {
          throw new Error("Downloaded file is empty");
        }

        const expectedLength = response.headers["content-length"];
        if (expectedLength && Number(expectedLength) !== tempStat.size) {
          throw new Error(`Size mismatch: expected ${expectedLength}, got ${tempStat.size}`);
        }

        await fs.move(tempPath, filePath, { overwrite: true });

        const info = await this.fileInfo(filePath);

        this.log(`Saved: ${filename} (${info.sizeMB} MB)`);

        return {
          status: "downloaded",
          sourceUrl: url,
          startedAt,
          downloadedAt: new Date().toISOString(),
          httpStatus: response.status,
          contentType: response.headers["content-type"] || null,
          contentLength: expectedLength ? Number(expectedLength) : null,
          ...info
        };
      } catch (err) {
        await fs.remove(tempPath).catch(() => { });

        if (attempt === maxRetries) {
          return {
            status: "failed",
            sourceUrl: url,
            fileName: filename,
            startedAt,
            failedAt: new Date().toISOString(),
            error: err.message
          };
        }

        this.log(`Attempt ${attempt} failed: ${err.message}`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  unzip(zipPath, customExtractFolder = null) {
    const filename = path.basename(zipPath, ".zip");
    const targetFolder = customExtractFolder || path.join(this.extractedFolder, filename);

    fs.ensureDirSync(targetFolder);

    try {
      this.log(`Extracting: ${path.basename(zipPath)}`);

      const zip = new AdmZip(zipPath);
      zip.extractAllTo(targetFolder, true);

      const entries = zip.getEntries().map(entry => ({
        entryName: entry.entryName,
        size: entry.header.size
      }));

      return {
        status: "extracted",
        zipPath,
        extractedFolder: targetFolder,
        extractedAt: new Date().toISOString(),
        fileCount: entries.length,
        entries
      };
    } catch (err) {
      return {
        status: "failed",
        zipPath,
        extractedFolder: targetFolder,
        failedAt: new Date().toISOString(),
        error: err.message
      };
    }
  }

  async saveJson(folder, filename, data) {
    fs.ensureDirSync(folder);
    const filePath = path.join(folder, this.safeFilename(filename));
    await fs.writeJson(filePath, data, { spaces: 2 });
    return filePath;
  }

  async saveMetadata(filename, data) {
    return this.saveJson(this.metadataFolder, filename, data);
  }

  async saveManifest(filename, data) {
    return this.saveJson(this.manifestFolder, filename, data);
  }
}

module.exports = Downloader;