const express = require("express");
const { downloadAllSources } = require("./src/extractors/finaldownload");

const app = express();
const PORT = process.env.PORT || 3000;

let running = false;
let lastManifest = null;

async function startDownload(force = false) {
  if (running) return;

  running = true;

  console.log("\n" + "=".repeat(70));
  console.log(`[${new Date().toISOString()}] STARTING REPRODUCIBLE DATASET DOWNLOAD`);
  console.log("=".repeat(70));

  try {
    lastManifest = await downloadAllSources({ force });

    console.log("\n" + "=".repeat(70));
    console.log(`[${new Date().toISOString()}] DATASET DOWNLOAD FINISHED`);
    console.log("=".repeat(70));
    console.log(JSON.stringify(lastManifest, null, 2));
  } catch (err) {
    lastManifest = {
      status: "failed",
      error: err.message,
      failedAt: new Date().toISOString()
    };

    console.error("Download failed:", err.message);
  } finally {
    running = false;
  }
}

app.get("/", (req, res) => {
  res.json({
    name: "German Traffic Accident Analytics - Reproducible Downloader",
    step: "Step 1 only: download raw datasets",
    endpoints: {
      download: "/download",
      forceDownload: "/download?force=true",
      status: "/status",
      health: "/health"
    }
  });
});

app.get("/download", (req, res) => {
  if (running) {
    return res.status(409).json({
      status: "already_running",
      message: "A download is already running."
    });
  }

  const force = req.query.force === "true";
  startDownload(force);

  res.status(202).json({
    status: "started",
    force,
    message: "Download started. Check terminal or /status."
  });
});

app.get("/status", (req, res) => {
  res.json({
    running,
    lastManifest
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    running,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Start download: http://localhost:${PORT}/download`);
  console.log(`Force download: http://localhost:${PORT}/download?force=true`);
  console.log(`Status: http://localhost:${PORT}/status`);
});