const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const AdmZip = require("adm-zip");
const crypto = require("crypto");

class Downloader {
  constructor(baseFolder = "./data") {
    /*
      This is the main data folder.

      Example:
      backend/data/
    */
    this.dataFolder = path.resolve(baseFolder);

    /*
      Raw downloaded files will be saved here.

      Examples:
      data/downloads/Unfallorte2024_EPSG25832_CSV.zip
      data/downloads/31122024_Auszug_GV.xlsx
      data/downloads/DSB_Unfallatlas.pdf
    */
    this.downloadsFolder = path.join(this.dataFolder, "downloads");

    /*
      Extracted ZIP files will be saved here.

      Example:
      data/extracted/Unfallorte2024_EPSG25832_CSV/
    */
    this.extractedFolder = path.join(this.dataFolder, "extracted");

    /*
      Metadata/reference pages will be saved here.

      Examples:
      data/metadata/govdata_page_1.html
      data/metadata/regionalatlas_homepage.html
      data/metadata/unfallatlas_source_reference.json
    */
    this.metadataFolder = path.join(this.dataFolder, "metadata");

    /*
      Final manifest file will be saved here.

      Example:
      data/manifest/download_manifest.json
    */
    this.manifestFolder = path.join(this.dataFolder, "manifest");

    /*
      Create folders automatically if they do not exist.
    */
    fs.ensureDirSync(this.downloadsFolder);
    fs.ensureDirSync(this.extractedFolder);
    fs.ensureDirSync(this.metadataFolder);
    fs.ensureDirSync(this.manifestFolder);
  }

  /*
    Simple logger.
    This makes terminal messages easier to understand.
  */
  log(message) {
    console.log(`[Downloader] ${message}`);
  }

  /*
    Makes filenames safe for the operating system.

    Some characters are not safe in file names:
    < > : " / \\ | ? *

    This function replaces those characters with "_".
  */
  safeFilename(filename) {
    return filename
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
      .replace(/\s+/g, "_")
      .slice(0, 180);
  }

  /*
    Extract filename from URL.

    Example:
    https://example.com/file.zip
    becomes:
    file.zip
  */
  filenameFromUrl(url) {
    const urlObj = new URL(url);
    const filename = decodeURIComponent(path.basename(urlObj.pathname));
    return filename || "download.bin";
  }

  /*
    Create SHA-256 checksum for a file.

    Why this is important:
    - It proves the downloaded file did not change.
    - It helps reproducibility.
    - It is useful for your project report.
  */
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

  /*
    Get file information after download.

    It returns:
    - file path
    - file name
    - file size
    - SHA-256 checksum
  */
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

  /*
    Main download function.

    Parameters:
    - url: official source URL
    - customFilename: filename we want to save as
    - options.force:
        false = use existing file if already downloaded
        true  = download again
    - options.folder:
        custom folder to save file
    - options.maxRetries:
        how many times to retry failed downloads
    - options.timeout:
        max time for request
  */
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

    /*
      If file already exists and force is false,
      do not download again.

      Instead:
      - read existing file
      - calculate checksum
      - return status "cached"
    */
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

    /*
      Retry loop.
      If download fails, try again.
    */
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.log(`Downloading: ${filename} (attempt ${attempt}/${maxRetries})`);

        /*
          Download using axios stream.

          responseType: "stream"
          means large files can be downloaded safely without loading the whole
          file into memory.
        */
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

        /*
          Remove old temporary file if it exists.
        */
        await fs.remove(tempPath);

        /*
          Write download to temporary file first.

          We do this because if a download fails halfway,
          we do not want to leave a broken final file.
        */
        const writer = fs.createWriteStream(tempPath);
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
          writer.on("finish", resolve);
          writer.on("error", reject);
          response.data.on("error", reject);
        });

        /*
          Check temporary file size.
        */
        const tempStat = await fs.stat(tempPath);

        /*
          Part 1:
          Always check that downloaded file is not empty.

          This protects all files:
          - ZIP
          - XLSX
          - PDF
          - CSV
          - HTML
        */
        if (tempStat.size === 0) {
          throw new Error("Downloaded file is empty");
        }

        /*
          Part 2:
          Read server response information.

          content-length:
          The size the server says it is sending.

          content-type:
          The type of file the server says it is sending.
        */
        const expectedLength = response.headers["content-length"];
        const contentType = response.headers["content-type"] || "";

        /*
          Part 3:
          Decide whether strict size checking should be used.

          For real data files, strict size checking is useful:
          - ZIP
          - XLSX
          - PDF
          - CSV

          But for HTML pages, strict size checking can create false errors.

          Why?
          Some websites compress, redirect, or dynamically generate HTML pages.
          Then the saved file size can be different from content-length.

          Example:
          Regionalatlas may say:
          expected 6326
          but saved file is:
          23902

          That does not always mean the download failed.
        */
        const shouldCheckSize =
          expectedLength &&
          !contentType.includes("text/html");

        /*
          Part 4:
          If it is not HTML and size is different, fail safely.

          This still protects important dataset files.
        */
        if (shouldCheckSize && Number(expectedLength) !== tempStat.size) {
          throw new Error(`Size mismatch: expected ${expectedLength}, got ${tempStat.size}`);
        }

        /*
          Part 5:
          Move temporary file to final file path.

          Only happens after the file passed checks.
        */
        await fs.move(tempPath, filePath, { overwrite: true });

        /*
          Calculate final file info:
          - file size
          - SHA-256 checksum
        */
        const info = await this.fileInfo(filePath);

        this.log(`Saved: ${filename} (${info.sizeMB} MB)`);

        /*
          Return download result for manifest.
        */
        return {
          status: "downloaded",
          sourceUrl: url,
          startedAt,
          downloadedAt: new Date().toISOString(),
          httpStatus: response.status,
          contentType,
          contentLength: expectedLength ? Number(expectedLength) : null,
          ...info
        };
      } catch (err) {
        /*
          If download failed, remove broken temporary file.
        */
        await fs.remove(tempPath).catch(() => { });

        /*
          If this was the final attempt, return failed status.
          We do not crash the whole program here.
        */
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

        /*
          Otherwise, wait and try again.
        */
        this.log(`Attempt ${attempt} failed: ${err.message}`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  /*
    Extract ZIP file.

    Used for Unfallatlas ZIP files.
  */
  unzip(zipPath, customExtractFolder = null) {
    const filename = path.basename(zipPath, ".zip");
    const targetFolder = customExtractFolder || path.join(this.extractedFolder, filename);

    fs.ensureDirSync(targetFolder);

    try {
      this.log(`Extracting: ${path.basename(zipPath)}`);

      const zip = new AdmZip(zipPath);
      zip.extractAllTo(targetFolder, true);

      /*
        Save ZIP entry list for manifest.
      */
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

  /*
    Save any object as JSON file.
  */
  async saveJson(folder, filename, data) {
    fs.ensureDirSync(folder);

    const filePath = path.join(folder, this.safeFilename(filename));

    await fs.writeJson(filePath, data, { spaces: 2 });

    return filePath;
  }

  /*
    Save metadata JSON file.

    Example:
    data/metadata/unfallatlas_source_reference.json
  */
  async saveMetadata(filename, data) {
    return this.saveJson(this.metadataFolder, filename, data);
  }

  /*
    Save manifest JSON file.

    Example:
    data/manifest/download_manifest.json
  */
  async saveManifest(filename, data) {
    return this.saveJson(this.manifestFolder, filename, data);
  }
}

module.exports = Downloader;