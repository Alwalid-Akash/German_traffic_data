const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");

const { buildOpenApiSpec } = require("./src/api/openapi");
const { downloadAllSources } = require("./src/etl/extractors/downloadhelper");
const { runEtl } = require("./src/etl/runetl");
const accidentInfoApi = require("./src/api/routes");


const app = express();

const PORT = process.env.PORT || 3000;


// =======================
// Middleware
// =======================

app.use(express.json());
// CORS Configuration
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://german-traffic-data.vercel.app"
    ],
    methods: [
      "GET",
      "POST",
      "OPTIONS"
    ],
    allowedHeaders: [
      "Content-Type"
    ]
  })
);
// Request Logger
app.use((req, res, next) => {

  const query =
    new URLSearchParams(req.query).toString();

  const suffix =
    query ? `?${query}` : "";


  console.log(
    `[${new Date().toISOString()}] ${req.method} ${req.path}${suffix}`
  );

  next();
});

// =======================
// Swagger
// =======================

const BASE_URL =
  process.env.BASE_URL ||
  `http://localhost:${PORT}`;


const openApiSpec =
  buildOpenApiSpec(BASE_URL);

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(openApiSpec)
);

app.get(
  "/openapi.json",
  (req, res) => {
    res.json(openApiSpec);
  }
);


// =======================
// API Routes
// =======================

app.use(
  "/accidentinfoapi",
  accidentInfoApi
);
// =======================
// ETL State
// =======================

let lastDownloadResult = null;
let lastEtlResult = null;
let etlRunning = false;



// =======================
// Basic Routes
// =======================

app.get("/", (req, res) => {

  res.json({

    project: "AccidentInfoAPI",

    message:
      "Backend is running",

    routes: {

      health: "/health",

      download: "/download",

      etl: "/etl",

      status: "/status",

      api:
        "/accidentinfoapi/health",

      swagger:
        "/api-docs"

    }

  });

});

app.get("/health", (req, res) => {

  res.json({

    status: "ok",

    message:
      "Server is running."

  });

});

// =======================
// Download Dataset
// =======================

app.get("/download", async (req, res) => {

  try {

    const force =
      req.query.force === "true";

    console.log(
      "DATASET DOWNLOAD STARTED"
    );

    const result =
      await downloadAllSources({
        force
      });

    lastDownloadResult = result;

    res.json({

      status: "success",

      message:
        "Download completed successfully.",

      result

    });


  } catch (error) {

    console.error(
      "Download failed:",
      error.message
    );

    res.status(500).json({

      status: "failed",

      message:
        "Download failed.",

      error:
        error.message

    });

  }

});

// =======================
// Run ETL
// =======================


app.get("/etl", async (req, res) => {


  if (etlRunning) {

    return res.status(409).json({

      status: "running",

      message:
        "ETL is already running."

    });

  }


  try {


    etlRunning = true;


    console.log(
      "ETL STARTED"
    );


    const result =
      await runEtl();


    lastEtlResult = result;



    if (result.status === "success") {


      return res.json({

        status: "success",

        message:
          "Data saved into database successfully.",

        result

      });

    }

    res.status(500).json({

      status: "failed",

      message:
        "ETL failed.",

      result

    });



  } catch (error) {


    console.error(
      "ETL failed:",
      error.message
    );

    res.status(500).json({

      status: "failed",

      message:
        "ETL failed.",

      error:
        error.message

    });



  } finally {

    etlRunning = false;

  }

});

// =======================
// Status
// =======================


app.get("/status", (req, res) => {

  res.json({

    server:
      "running",

    etlRunning,

    lastDownloadResult,

    lastEtlResult

  });

});

// =======================
// 404 Handler
// =======================

app.use((req, res) => {

  res.status(404).json({

    error:
      "Not found",

    message:
      "Route does not exist."

  });

});

// =======================
// Error Handler
// =======================

app.use((err, req, res, next) => {

  console.error(err);


  res.status(
    err.statusCode || 500
  )
    .json({

      error:
        "Server error",

      message:
        err.message ||
        "Unexpected error."

    });

});

// =======================
// Start Server
// =======================

app.listen(PORT, () => {


  console.log(
    `Server running on port ${PORT}`
  );


  console.log(
    `Health: ${BASE_URL}/health`
  );


  console.log(
    `Swagger: ${BASE_URL}/api-docs`
  );


  console.log(
    `API: ${BASE_URL}/accidentinfoapi/health`
  );


});