const BaseExtractor = require("../baseextractor");

const SOURCE = {
  code: "gvisys",
  name: "GV-ISys Gemeindeverzeichnis 2024",
  provider: "Statistisches Bundesamt Destatis",
  url: "https://www.destatis.de/DE/Themen/Laender-Regionen/Regionales/Gemeindeverzeichnis/_inhalt.html",
  note: "Official German municipality and regional reference dataset. Used for AGS codes, region names, hierarchy, population, and area."
};

class GVISys extends BaseExtractor {
  constructor(downloader) {
    super(downloader, SOURCE);

    this.files = [
      {
        code: "31122024_Auszug_GV",
        name: "Alle politisch selbständigen Gemeinden mit ausgewählten Merkmalen am 31.12.2024",
        fileName: "31122024_Auszug_GV.xlsx",
        role: "Main regional reference dataset for the project",
        url: "https://www.destatis.de/DE/Themen/Laender-Regionen/Regionales/Gemeindeverzeichnis/Administrativ/Archiv/GVAuszugJ/31122024_Auszug_GV.xlsx?__blob=publicationFile&v=2",
        datasetDate: "2024-12-31",
        datasetYear: 2024
      }
    ];
  }

  async downloadAll(force = false) {
    const sourceReferenceFile = await this.saveSourceReference({
      role: "Core data source",
      note: "GV-ISys 31.12.2024 is used because it matches the latest Unfallatlas accident year used in the project.",
      files: this.files
    });

    const files = [];
    const errors = [];

    for (const file of this.files) {
      this.log(`Downloading GV-ISys file: ${file.name}`);
      console.log(file.url);

      try {
        const download = await this.downloader.download(
          file.url,
          file.fileName,
          {
            force,
            folder: this.downloader.downloadsFolder,
            timeout: 120000,
            maxRetries: 2
          }
        );

        if (download.status === "failed") {
          errors.push({
            status: "failed",
            sourceCode: this.sourceCode,
            sourceName: this.sourceName,
            fileCode: file.code,
            fileName: file.fileName,
            error: download.error
          });

          continue;
        }

        const metadata = {
          sourceCode: this.sourceCode,
          sourceName: this.sourceName,
          provider: SOURCE.provider,
          fileCode: file.code,
          fileName: file.fileName,
          fileTitle: file.name,
          role: file.role,
          sourceUrl: file.url,
          datasetDate: file.datasetDate,
          datasetYear: file.datasetYear,
          download,
          savedAt: new Date().toISOString()
        };

        const metadataPath = await this.downloader.saveMetadata(
          `${this.sourceCode}_${file.code}_metadata.json`,
          metadata
        );

        files.push({
          status: download.status,
          sourceCode: this.sourceCode,
          sourceName: this.sourceName,
          fileCode: file.code,
          fileName: file.fileName,
          fileTitle: file.name,
          role: file.role,
          sourceUrl: file.url,
          datasetDate: file.datasetDate,
          datasetYear: file.datasetYear,
          filePath: download.filePath,
          sha256: download.sha256,
          metadataPath
        });
      } catch (err) {
        errors.push({
          status: "failed",
          sourceCode: this.sourceCode,
          sourceName: this.sourceName,
          fileCode: file.code,
          fileName: file.fileName,
          error: err.message
        });
      }
    }

    return {
      sourceCode: this.sourceCode,
      sourceName: this.sourceName,
      sourceReferenceFile,
      downloadedCount: files.length,
      failedCount: errors.length,
      files,
      errors
    };
  }
}

module.exports = GVISys;