const fs = require("fs-extra");
const BaseExtractor = require("../baseextractor");

const SOURCE = {
  code: "regionalatlas",
  name: "Regionalatlas / Regionalstatistik GENESIS",
  provider: "Statistische Ämter des Bundes und der Länder",
  url: "https://www.regionalstatistik.de/genesis/online",
  note: "Core statistical data source for traffic accidents, population, area, vehicles, and passenger cars."
};

class RegionalAtlas extends BaseExtractor {
  constructor(downloader) {
    super(downloader, SOURCE);

    this.tables = [
      {
        code: "46241-01-04-4",
        name: "Traffic accidents and injured persons - districts/cities",
        fileName: "regionalatlas_46241-01-04-4_traffic_accidents_districts.csv",
        role: "Official aggregated traffic accident statistics at district/city level",
        indicatorCode: "regional_traffic_accidents_districts",
        indicatorName: "Traffic accidents - districts/cities",
        unit: "count"
      },
      {
        code: "46241-01-04-5",
        name: "Traffic accidents and injured persons - municipalities",
        fileName: "regionalatlas_46241-01-04-5_traffic_accidents_municipalities.csv",
        role: "Official aggregated traffic accident statistics at municipality level",
        indicatorCode: "regional_traffic_accidents_municipalities",
        indicatorName: "Traffic accidents - municipalities",
        unit: "count"
      },
      {
        code: "12411-01-01-4",
        name: "Population by sex - districts/cities",
        fileName: "regionalatlas_12411-01-01-4_population_districts.csv",
        role: "Population data for accident rates per 100,000 inhabitants at district/city level",
        indicatorCode: "population_districts",
        indicatorName: "Population - districts/cities",
        unit: "persons"
      },
      {
        code: "12411-01-01-5",
        name: "Population by sex - municipalities",
        fileName: "regionalatlas_12411-01-01-5_population_municipalities.csv",
        role: "Population data for accident rates per 100,000 inhabitants at municipality level",
        indicatorCode: "population_municipalities",
        indicatorName: "Population - municipalities",
        unit: "persons"
      },
      {
        code: "11111-01-01-4",
        name: "Area in km² - districts/cities",
        fileName: "regionalatlas_11111-01-01-4_area_districts.csv",
        role: "Area data for accident density per km² at district/city level",
        indicatorCode: "area_km2_districts",
        indicatorName: "Area in km² - districts/cities",
        unit: "km2"
      },
      {
        code: "11111-01-01-5",
        name: "Area in km² - municipalities",
        fileName: "regionalatlas_11111-01-01-5_area_municipalities.csv",
        role: "Area data for accident density per km² at municipality level",
        indicatorCode: "area_km2_municipalities",
        indicatorName: "Area in km² - municipalities",
        unit: "km2"
      },
      {
        code: "46251-01-03-4",
        name: "Vehicle stock by vehicle type - districts/cities",
        fileName: "regionalatlas_46251-01-03-4_vehicle_stock_districts.csv",
        role: "Vehicle stock data for accident rates per registered vehicles",
        indicatorCode: "vehicle_stock_districts",
        indicatorName: "Vehicle stock - districts/cities",
        unit: "vehicles"
      },
      {
        code: "46251-02-01-4",
        name: "Passenger cars by fuel type - districts/cities",
        fileName: "regionalatlas_46251-02-01-4_passenger_cars_districts.csv",
        role: "Passenger car data for accidents per 100,000 registered passenger cars",
        indicatorCode: "passenger_cars_districts",
        indicatorName: "Passenger cars - districts/cities",
        unit: "cars"
      }
    ];
  }

  buildDirectCsvUrl(tableCode) {
    return `https://www.regionalstatistik.de/genesisws/downloader/00/tables/${tableCode}_00.csv`;
  }

  buildFallbackDownloadUrl(tableCode) {
    const params = new URLSearchParams();

    params.set("operation", "download");
    params.set("code", tableCode);
    params.set("option", "csv");
    params.set("language", "de");

    return `${SOURCE.url}?${params.toString()}`;
  }

  async fileLooksLikeHtml(filePath) {
    if (!await fs.pathExists(filePath)) {
      return false;
    }

    const buffer = await fs.readFile(filePath);

    const firstText = buffer
      .toString("utf8", 0, Math.min(buffer.length, 500))
      .trim()
      .toLowerCase();

    return (
      firstText.startsWith("<!doctype html") ||
      firstText.startsWith("<html") ||
      firstText.includes("<html")
    );
  }

  async downloadTable(table, force = false) {
    const directUrl = this.buildDirectCsvUrl(table.code);
    const fallbackUrl = this.buildFallbackDownloadUrl(table.code);

    this.log(`Downloading table: ${table.code}`);
    console.log(directUrl);

    let download = await this.downloader.download(
      directUrl,
      table.fileName,
      {
        force,
        folder: this.downloader.downloadsFolder,
        timeout: 120000,
        maxRetries: 2
      }
    );

    if (
      download.status !== "failed" &&
      await this.fileLooksLikeHtml(download.filePath)
    ) {
      this.log(`Direct CSV returned HTML. Trying fallback URL for ${table.code}`);
      console.log(fallbackUrl);

      download = await this.downloader.download(
        fallbackUrl,
        table.fileName,
        {
          force: true,
          folder: this.downloader.downloadsFolder,
          timeout: 120000,
          maxRetries: 2
        }
      );
    }

    if (
      download.status !== "failed" &&
      await this.fileLooksLikeHtml(download.filePath)
    ) {
      return {
        status: "failed",
        sourceCode: this.sourceCode,
        sourceName: this.sourceName,
        tableCode: table.code,
        tableName: table.name,
        role: table.role,
        indicatorCode: table.indicatorCode,
        indicatorName: table.indicatorName,
        unit: table.unit,
        directUrl,
        fallbackUrl,
        filePath: download.filePath,
        fileName: table.fileName,
        error: "Downloaded HTML instead of CSV. This table may require filters or may not be available through direct download."
      };
    }

    if (download.status === "failed") {
      return {
        status: "failed",
        sourceCode: this.sourceCode,
        sourceName: this.sourceName,
        tableCode: table.code,
        tableName: table.name,
        role: table.role,
        indicatorCode: table.indicatorCode,
        indicatorName: table.indicatorName,
        unit: table.unit,
        directUrl,
        fallbackUrl,
        fileName: table.fileName,
        error: download.error
      };
    }

    const metadata = {
      sourceCode: this.sourceCode,
      sourceName: this.sourceName,
      provider: SOURCE.provider,
      tableCode: table.code,
      tableName: table.name,
      role: table.role,
      indicatorCode: table.indicatorCode,
      indicatorName: table.indicatorName,
      unit: table.unit,
      directUrl,
      fallbackUrl,
      download,
      savedAt: new Date().toISOString()
    };

    const safeTableCode = table.code.replace(/[^a-zA-Z0-9_-]/g, "_");

    const metadataPath = await this.downloader.saveMetadata(
      `${this.sourceCode}_${safeTableCode}_metadata.json`,
      metadata
    );

    return {
      status: download.status,
      sourceCode: this.sourceCode,
      sourceName: this.sourceName,
      tableCode: table.code,
      tableName: table.name,
      role: table.role,
      indicatorCode: table.indicatorCode,
      indicatorName: table.indicatorName,
      unit: table.unit,
      directUrl,
      fallbackUrl,
      filePath: download.filePath,
      fileName: table.fileName,
      sha256: download.sha256,
      metadataPath
    };
  }

  async downloadAll(force = false) {
    const sourceReferenceFile = await this.saveSourceReference({
      role: "Core data source",
      note: "Regionalatlas / Regionalstatistik is used as real statistical indicator data, not only as a reference link.",
      tables: this.tables
    });

    const files = [];
    const errors = [];

    for (const table of this.tables) {
      try {
        const result = await this.downloadTable(table, force);

        if (result.status === "failed") {
          errors.push(result);
        } else {
          files.push(result);
        }
      } catch (err) {
        errors.push({
          status: "failed",
          sourceCode: this.sourceCode,
          sourceName: this.sourceName,
          tableCode: table.code,
          tableName: table.name,
          role: table.role,
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

module.exports = RegionalAtlas;