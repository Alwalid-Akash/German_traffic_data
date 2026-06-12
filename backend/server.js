const express = require("express");

const { downloadAllSources } = require("./src/etl/extractors/finaldownload");
const { runEtl } = require("./src/etl/runetl");
const accidentInfoApi = require("./src/api/routes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

app.use((req, res, next) => {
  const query = new URLSearchParams(req.query).toString();
  const suffix = query ? `?${query}` : "";
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}${suffix}`);
  next();
});

app.use("/accidentinfoapi", accidentInfoApi);

let lastDownloadResult = null;
let lastEtlResult = null;
let etlRunning = false;

app.get("/", (req, res) => {
  res.json({
    project: "AccidentInfoAPI",
    message: "Backend is running. Use /download, /etl, and /status for the reproducible pipeline.",
    routes: {
      health: "/health",
      download: "/download",
      etl: "/etl",
      status: "/status",
      api: "/accidentinfoapi/health"
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

app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.statusCode || 500).json({
    error: err.statusCode ? "Bad request" : "Server error",
    message: err.message || "Unexpected server error."
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/health`);
  console.log(`Download: http://localhost:${PORT}/download`);
  console.log(`Force download: http://localhost:${PORT}/download?force=true`);
  console.log(`Run ETL: http://localhost:${PORT}/etl`);
  console.log(`Status: http://localhost:${PORT}/status`);
  console.log(`AccidentInfoAPI: http://localhost:${PORT}/accidentinfoapi/health`);
  console.log(`OpenAPI: http://localhost:${PORT}/accidentinfoapi/openapi.json`);
});

app.use((req, res) => {
  res.status(404).json({
    error: "Not found",
    message: "Available routes: /health, /download, /etl, /status, /accidentinfoapi/health.",
  });
});
