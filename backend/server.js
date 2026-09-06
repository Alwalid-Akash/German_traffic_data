const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");

const { buildOpenApiSpec } = require("./src/api/openapi");
const { downloadAllSources } = require("./src/etl/extractors/downloadhelper");
const { runEtl } = require("./src/etl/runetl");
const accidentInfoApi = require("./src/api/routes");

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = "https://german-traffic-data.vercel.app";
const FALLBACK_BACKEND_URL = "https://german-traffic-data.onrender.com";

let lastDownloadResult = null;
let lastEtlResult = null;
let etlRunning = false;

function getBaseUrl() {
  const configuredUrl =
    process.env.PUBLIC_BASE_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    process.env.BASE_URL;

  if (!configuredUrl || configuredUrl.includes("localhost")) {
    return FALLBACK_BACKEND_URL;
  }

  return configuredUrl.replace(/\/$/, "");
}

function isAllowedOrigin(origin) {
  return (
    !origin ||
    origin === "http://localhost:5173" ||
    origin === FRONTEND_URL ||
    /^https:\/\/.*\.vercel\.app$/.test(origin)
  );
}

function logSection(title, detail = null) {
  console.log("======================================");
  console.log(title);
  if (detail) console.log(detail);
  console.log("======================================");
}

const BASE_URL = getBaseUrl();
const openApiSpec = buildOpenApiSpec(BASE_URL);

app.use(express.json());

app.use(cors({
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) return callback(null, true);
    return callback(new Error("CORS blocked"));
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
}));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));
app.use("/accidentinfoapi", accidentInfoApi);

app.get("/", (req, res) => {
  res.json({
    project: "German Traffic Accident API",
    message: "Backend running successfully",
    frontend: FRONTEND_URL,
    backend: BASE_URL,
    routes: {
      health: "/health",
      metadata: "/metadata",
      download: "/download",
      forceDownload: "/download?force=true",
      etl: "/etl",
      status: "/status",
      swagger: "/api-docs/",
      accidentInfoApi: "/accidentinfoapi/health",
    },
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

app.get("/openapi.json", (req, res) => {
  res.json(openApiSpec);
});

app.get("/metadata", (req, res) => {
  res.json({
    project: "AccidentInfoAPI",
    backend: BASE_URL,
    frontend: FRONTEND_URL,
    documentation: `${BASE_URL}/api-docs/`,
    usefulRoutes: {
      health: "/health",
      apiHealth: "/accidentinfoapi/health",
      metadataCoverage: "/accidentinfoapi/metadata/coverage",
      metadataOptions: "/accidentinfoapi/metadata/options",
      download: "/download",
      forceDownload: "/download?force=true",
      etl: "/etl",
      status: "/status",
      swagger: "/api-docs/",
    },
  });
});

app.get("/download", async (req, res) => {
  try {
    const force = req.query.force === "true";
    logSection("DATASET DOWNLOAD STARTED", `Force download: ${force}`);

    const result = await downloadAllSources({ force });
    lastDownloadResult = result;

    console.log("DATASET DOWNLOAD FINISHED");
    console.log(result);

    res.json({
      status: "success",
      message: "Download completed successfully",
      result,
    });
  } catch (error) {
    console.error("DOWNLOAD FAILED:", error.message);
    res.status(500).json({
      status: "failed",
      message: "Download failed",
      error: error.message,
    });
  }
});

app.get("/etl", async (req, res) => {
  if (etlRunning) {
    return res.status(409).json({
      status: "running",
      message: "ETL already running",
    });
  }

  try {
    etlRunning = true;
    logSection("ETL STARTED");

    const result = await runEtl();
    lastEtlResult = result;

    console.log("ETL RESULT:");
    console.log(result);

    if (result.status === "success") {
      console.log("ETL COMPLETED SUCCESSFULLY");
      return res.json({
        status: "success",
        message: "Data saved successfully",
        result,
      });
    }

    return res.status(500).json({
      status: "failed",
      message: "ETL failed",
      result,
    });
  } catch (error) {
    console.error("ETL ERROR:", error.message);
    return res.status(500).json({
      status: "failed",
      message: "ETL failed",
      error: error.message,
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
    lastEtlResult,
  });
});

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Server error", message: err.message });
});

app.listen(PORT, () => {
  console.log("\n======================================");
  console.log("AccidentInfoAPI backend is running");
  console.log("======================================");
  console.log(`Local server:        http://localhost:${PORT}`);
  console.log(`Backend URL:         ${BASE_URL}`);
  console.log(`Swagger UI:          ${BASE_URL}/api-docs/`);
  console.log(`Health:              ${BASE_URL}/health`);
  console.log(`API health:          ${BASE_URL}/accidentinfoapi/health`);
  console.log(`Metadata:            ${BASE_URL}/metadata`);
  console.log(`Download:            ${BASE_URL}/download`);
  console.log(`Force download:      ${BASE_URL}/download?force=true`);
  console.log(`Run ETL:             ${BASE_URL}/etl`);
  console.log(`Status:              ${BASE_URL}/status`);
  console.log("\nTerminal commands:");
  console.log("  cd backend");
  console.log("  npm run init-db");
  console.log("  npm run download");
  console.log("  npm run etl");
  console.log("  npm run dev");
  console.log("======================================\n");
});
