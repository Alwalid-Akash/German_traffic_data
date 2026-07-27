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


// =======================
// CORS Configuration
// =======================

const allowedOrigins = [

  "http://localhost:5173",

  "https://german-traffic-data.vercel.app"

];


function isAllowedOrigin(origin) {
  if (!origin) {
    return true;
  }

  if (allowedOrigins.includes(origin)) {
    return true;
  }

  return /^https:\/\/.*\.vercel\.app$/.test(origin);
}


app.use(
  cors({

    origin: function (origin, callback) {


      if (isAllowedOrigin(origin)) {

        return callback(null, true);

      }


      return callback(
        new Error("CORS blocked")
      );


    },


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



// =======================
// Request Logger
// =======================

app.use(
  (req, res, next) => {


    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.url}`
    );


    next();


  });



// =======================
// Swagger
// =======================


const configuredBaseUrl =
  process.env.PUBLIC_BASE_URL ||
  process.env.RENDER_EXTERNAL_URL ||
  process.env.BASE_URL;

const BASE_URL =
  configuredBaseUrl && !configuredBaseUrl.includes("localhost")
    ? configuredBaseUrl.replace(/\/$/, "")
    : "https://german-traffic-data.onrender.com";



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

  });


app.get(
  "/metadata",
  (req, res) => {

    res.json({

      project:
        "AccidentInfoAPI",

      backend:
        BASE_URL,

      frontend:
        "https://german-traffic-data.vercel.app",

      documentation:
        `${BASE_URL}/api-docs/`,

      usefulRoutes: {

        health:
          "/health",

        apiHealth:
          "/accidentinfoapi/health",

        metadataCoverage:
          "/accidentinfoapi/metadata/coverage",

        metadataOptions:
          "/accidentinfoapi/metadata/options",

        download:
          "/download",

        forceDownload:
          "/download?force=true",

        etl:
          "/etl",

        status:
          "/status",

        swagger:
          "/api-docs/"

      }

    });

  });



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
// Home
// =======================


app.get(
  "/",
  (req, res) => {


    res.json({

      project:
        "German Traffic Accident API",


      message:
        "Backend running successfully",


      frontend:
        "https://german-traffic-data.vercel.app",


      backend:
        "https://german-traffic-data.onrender.com",


      routes: {

        health: "/health",

        metadata: "/metadata",

        download: "/download",

        forceDownload: "/download?force=true",

        etl: "/etl",

        status: "/status",

        swagger: "/api-docs/",

        accidentInfoApi: "/accidentinfoapi/health"

      }


    });


  });



// =======================
// Health
// =======================


app.get(
  "/health",
  (req, res) => {


    res.json({

      status: "ok",

      message:
        "Server is running"

    });


  });




// =======================
// Download Dataset
// =======================


app.get(
  "/download",
  async (req, res) => {


    try {


      const force =
        req.query.force === "true";



      console.log(
        "======================================"
      );


      console.log(
        "DATASET DOWNLOAD STARTED"
      );


      console.log(
        "Force download:",
        force
      );


      console.log(
        "======================================"
      );



      const result =
        await downloadAllSources({

          force

        });



      lastDownloadResult =
        result;



      console.log(
        "DATASET DOWNLOAD FINISHED"
      );


      console.log(result);



      res.json({

        status: "success",

        message:
          "Download completed successfully",

        result

      });



    }

    catch (error) {


      console.error(
        "DOWNLOAD FAILED:",
        error.message
      );



      res.status(500)
        .json({

          status: "failed",

          message:
            "Download failed",

          error:
            error.message

        });


    }



  });




// =======================
// Run ETL
// =======================


app.get(
  "/etl",
  async (req, res) => {


    if (etlRunning) {


      return res.status(409)
        .json({

          status: "running",

          message:
            "ETL already running"

        });


    }



    try {


      etlRunning = true;



      console.log(
        "======================================"
      );


      console.log(
        "ETL STARTED"
      );


      console.log(
        "======================================"
      );



      const result =
        await runEtl();



      lastEtlResult =
        result;



      console.log(
        "ETL RESULT:"
      );


      console.log(result);



      if (result.status === "success") {



        console.log(
          "ETL COMPLETED SUCCESSFULLY"
        );



        return res.json({

          status: "success",

          message:
            "Data saved successfully",

          result

        });


      }



      res.status(500)
        .json({

          status: "failed",

          message:
            "ETL failed",

          result

        });



    }

    catch (error) {


      console.error(
        "ETL ERROR:",
        error.message
      );



      res.status(500)
        .json({

          status: "failed",

          message:
            "ETL failed",

          error:
            error.message

        });


    }


    finally {


      etlRunning = false;


    }



  });




// =======================
// Status
// =======================


app.get(
  "/status",
  (req, res) => {


    res.json({

      server:
        "running",

      etlRunning,

      lastDownloadResult,

      lastEtlResult


    });


  });




// =======================
// 404
// =======================


app.use(
  (req, res) => {


    res.status(404)
      .json({

        error:
          "Route not found"

      });


  });




// =======================
// Error Handler
// =======================


app.use(
  (err, req, res, next) => {


    console.error(err);


    res.status(500)
      .json({

        error:
          "Server error",

        message:
          err.message

      });


  });




// =======================
// Start Server
// =======================


app.listen(
  PORT,
  () => {


    console.log(
      "\n======================================"
    );


    console.log(
      "AccidentInfoAPI backend is running"
    );


    console.log(
      "======================================"
    );


    console.log(
      `Local server:        http://localhost:${PORT}`
    );


    console.log(
      `Backend URL:         ${BASE_URL}`
    );


    console.log(
      `Swagger UI:          ${BASE_URL}/api-docs/`
    );


    console.log(
      `Health:              ${BASE_URL}/health`
    );


    console.log(
      `API health:          ${BASE_URL}/accidentinfoapi/health`
    );


    console.log(
      `Metadata:            ${BASE_URL}/metadata`
    );


    console.log(
      `Metadata coverage:   ${BASE_URL}/accidentinfoapi/metadata/coverage`
    );


    console.log(
      `Metadata options:    ${BASE_URL}/accidentinfoapi/metadata/options`
    );


    console.log(
      `Download:            ${BASE_URL}/download`
    );


    console.log(
      `Force download:      ${BASE_URL}/download?force=true`
    );


    console.log(
      `Run ETL:             ${BASE_URL}/etl`
    );


    console.log(
      `Status:              ${BASE_URL}/status`
    );


    console.log(
      "\nTerminal commands:"
    );


    console.log(
      "  cd backend"
    );


    console.log(
      "  npm run init-db"
    );


    console.log(
      "  npm run download"
    );


    console.log(
      "  npm run etl"
    );


    console.log(
      "  npm run dev"
    );


    console.log(
      "======================================\n"
    );


  });
