/*
  downloader.js

  This is the shared download helper for the whole backend project.

  Purpose:
  - Create data folders
  - Download files from URLs
  - Reuse cached files when force=false
  - Retry failed downloads
  - Save files safely
  - Calculate SHA-256 checksum
  - Extract ZIP files
  - Save metadata JSON
  - Save manifest JSON

  Important:
  This file should NOT contain source-specific logic.

  Do NOT put these here:
  - Unfallatlas year logic
  - GV-ISys parsing logic
  - Regionalatlas table codes
  - Accident transformation logic
  - Database loading logic

  This file only answers:
  "How do we download and store raw files reproducibly?"
*/

const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const AdmZip = require("adm-zip");
const crypto = require("crypto");

class Downloader {
  constructor(baseFolder = "./data") {
    /*
      Main project data folder.

      Default:
      backend/data/
    */
    this.dataFolder = path.resolve(baseFolder);

    /*
      Folder for downloaded raw files.

      Example:
      data/downloads/
    */
    this.downloadsFolder = path.join(this.dataFolder, "downloads");

    /*
      Folder for extracted ZIP contents.

      Example:
      data/extracted/
    */
    this.extractedFolder = path.join(this.dataFolder, "extracted");

    /*
      Folder for source metadata files.

      Example:
      data/metadata/
    */
    this.metadataFolder = path.join(this.dataFolder, "metadata");

    /*
      Folder for project-level manifest files.

      Example:
      data/manifest/
    */
    this.manifestFolder = path.join(this.dataFolder, "manifest");

    /*
      Ensure all folders exist before downloading.
    */
    fs.ensureDirSync(this.downloadsFolder);
    fs.ensureDirSync(this.extractedFolder);
    fs.ensureDirSync(this.metadataFolder);
    fs.ensureDirSync(this.manifestFolder);
  }

  /*
    Small logger helper.
    Keeps downloader logs easy to recognize in terminal output.
  */
  log(message) {
    console.log(`[Downloader] ${message}`);
  }

  /*
    Convert unsafe filenames into safe local filenames.

    Why:
    Some URLs or source titles may contain characters that are not safe
    on Windows/macOS/Linux file systems.
  */
  safeFilename(filename) {
    return String(filename)
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
      .replace(/\s+/g, "_")
      .slice(0, 180);
  }

  /*
    If no custom filename is provided, create a filename from the URL path.
  */
  filenameFromUrl(url) {
    const urlObj = new URL(url);
    const filename = decodeURIComponent(path.basename(urlObj.pathname));

    return filename || "download.bin";
  }

  /*
    Calculate SHA-256 checksum for a file.

    Why:
    Checksums help prove that the raw file was saved unchanged.
    This is useful for reproducibility and provenance.
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
    Return common file information.

    Used after download or when using cached files.
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
    Download a file from a URL.

    Parameters:
    - url: source URL
    - customFilename: filename to save as
    - options.force:
        true  = download again even if file exists
        false = reuse cached file if file already exists
    - options.folder:
        custom target folder
    - options.timeout:
        request timeout in milliseconds
    - options.maxRetries:
        number of retry attempts

    Return:
    - status: downloaded, cached, or failed
    - file path
    - checksum
    - file size
    - source URL
  */
  async download(url, customFilename, options = {}) {
    const force = options.force === true;
    const folder = options.folder || this.downloadsFolder;
    const maxRetries = options.maxRetries || 3;
    const retryDelay = options.retryDelay || 3000;

    fs.ensureDirSync(folder);

    const filename = this.safeFilename(customFilename || this.filenameFromUrl(url));
    const filePath = path.join(folder, filename);

    /*
      Temporary file path.

      We first download into ".part".
      Only after successful download do we move it to the final filename.

      This prevents broken partial files from being treated as complete files.
    */
    const tempPath = `${filePath}.part`;

    const startedAt = new Date().toISOString();

    /*
      Cache behavior.

      If the file already exists and force=false,
      do not download again.
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

      Network downloads can fail sometimes.
      We retry before reporting failure.
    */
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.log(`Downloading: ${filename} (attempt ${attempt}/${maxRetries})`);

        /*
          responseType: "stream"
          means large files are streamed directly to disk instead of loading
          the whole file into memory.
        */
        const response = await axios.get(url, {
          responseType: "stream",
          timeout: options.timeout || 300000,
          maxRedirects: 10,
          headers: {
            "User-Agent": "Mozilla/5.0",
            Accept: "*/*"
          },
          validateStatus: status => status >= 200 && status < 300
        });

        /*
          Remove old incomplete temp file if it exists.
        */
        await fs.remove(tempPath);

        /*
          Write the response stream into the temp file.
        */
        const writer = fs.createWriteStream(tempPath);
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
          writer.on("finish", resolve);
          writer.on("error", reject);
          response.data.on("error", reject);
        });

        /*
          Basic validation:
          downloaded file should not be empty.
        */
        const tempStat = await fs.stat(tempPath);

        if (tempStat.size === 0) {
          throw new Error("Downloaded file is empty");
        }

        /*
          If server provides content-length, check file size.
        */
        const expectedLength = response.headers["content-length"];

        if (expectedLength && Number(expectedLength) !== tempStat.size) {
          throw new Error(
            `Size mismatch: expected ${expectedLength}, got ${tempStat.size}`
          );
        }

        /*
          Move temp file to final path after successful validation.
        */
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
        /*
          Remove failed partial file.
        */
        await fs.remove(tempPath).catch(() => { });

        /*
          If this was the last retry, return failed status.
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
          Otherwise wait and try again.
        */
        this.log(`Attempt ${attempt} failed: ${err.message}`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  /*
    Extract a ZIP file.

    Used by sources like Unfallatlas if they provide ZIP downloads.
  */
  unzip(zipPath, customExtractFolder = null) {
    const filename = path.basename(zipPath, ".zip");

    const targetFolder =
      customExtractFolder || path.join(this.extractedFolder, filename);

    fs.ensureDirSync(targetFolder);

    try {
      this.log(`Extracting: ${path.basename(zipPath)}`);

      const zip = new AdmZip(zipPath);
      zip.extractAllTo(targetFolder, true);

      /*
        Store ZIP entry information for provenance/debugging.
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
    Save JSON to a selected folder.

    This is used internally by:
    - saveMetadata()
    - saveManifest()
  */
  async saveJson(folder, filename, data) {
    fs.ensureDirSync(folder);

    const filePath = path.join(folder, this.safeFilename(filename));

    await fs.writeJson(filePath, data, { spaces: 2 });

    return filePath;
  }

  /*
    Save metadata JSON for one source or one downloaded file.

    Example:
    data/metadata/regionalatlas_12411-01-01-4_metadata.json
  */
  async saveMetadata(filename, data) {
    return this.saveJson(this.metadataFolder, filename, data);
  }

  /*
    Save project-level manifest JSON.

    Example:
    data/manifest/download_manifest.json
  */
  async saveManifest(filename, data) {
    return this.saveJson(this.manifestFolder, filename, data);
  }
}

module.exports = Downloader;