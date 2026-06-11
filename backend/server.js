const express = require("express");

const { downloadAllSources } = require("./src/extractors/finaldownload");
const { runEtl } = require("./src/etl/runetl");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

let lastDownloadResult = null;
let lastEtlResult = null;
let etlRunning = false;

app.get("/", (req, res) => {
  res.json({
    project: "German Traffic Accident Analytics",
    message: "Backend is running.",
    routes: {
      health: "/health",
      download: "/download",
      forceDownload: "/download?force=true",
      etl: "/etl",
      status: "/status"
    }
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Server is running."
  });
});

app.get("/download", async (req, res) => {
  try {
    const force = req.query.force === "true";

    console.log("======================================");
    console.log("DATASET DOWNLOAD STARTED");
    console.log("Force download:", force);
    console.log("======================================");

    const result = await downloadAllSources({ force });

    lastDownloadResult = result;

    console.log("======================================");
    console.log("DATASET DOWNLOAD FINISHED");
    console.log("======================================");

    res.json({
      status: "success",
      message: "Download completed successfully.",
      result
    });
  } catch (err) {
    console.error("Download failed:", err.message);

    res.status(500).json({
      status: "failed",
      message: "Download failed.",
      error: err.message
    });
  }
});

app.get("/etl", async (req, res) => {
  if (etlRunning) {
    return res.status(409).json({
      status: "running",
      message: "ETL is already running. Please wait until it finishes."
    });
  }

  try {
    etlRunning = true;

    console.log("======================================");
    console.log("ETL TRIGGERED FROM SERVER");
    console.log("======================================");

    const result = await runEtl();

    lastEtlResult = result;

    if (result.status === "success") {
      return res.json({
        status: "success",
        message: "Complete: data saved into database successfully.",
        result
      });
    }

    return res.status(500).json({
      status: "failed",
      message: "ETL failed.",
      result
    });
  } catch (err) {
    console.error("ETL failed:", err.message);

    res.status(500).json({
      status: "failed",
      message: "ETL failed.",
      error: err.message
    });
  } finally {
    etlRunning = false;
  }
});

app.get("/status", (req, res) => {
  res.json({
    server: "running",
    etlRunning,
    lastDownloadResult,
    lastEtlResult
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/health`);
  console.log(`Download: http://localhost:${PORT}/download`);
  console.log(`Force download: http://localhost:${PORT}/download?force=true`);
  console.log(`Run ETL: http://localhost:${PORT}/etl`);
  console.log(`Status: http://localhost:${PORT}/status`);
});