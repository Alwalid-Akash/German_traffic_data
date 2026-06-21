const express = require("express");
const {
  getCoverage,
  getFilterOptions,
  listRegions,
  getRegionByAgs,
  earliestAccidentYear,
  countAccidents,
  availableFrom,
  passengerCarRate,
  topFatalDistricts,
  zeroAccidentMunicipalities,
  validateYear,
  validateInteger,
} = require("./queries");
const { buildOpenApiSpec } = require("./openapi");
const { getQuestionCatalog } = require("./catalog");

const router = express.Router();

function asyncRoute(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

router.get("/health", (req, res) => {
  res.json({
    api: "accidentinfoapi",
    status: "ok",
    message: "AccidentInfoAPI is running.",
  });
});

router.get("/openapi.json", (req, res) => {
  res.json(buildOpenApiSpec(`${req.protocol}://${req.get("host")}`));
});

router.get("/question-catalog", (req, res) => {
  res.json({
    api: "accidentinfoapi",
    questions: getQuestionCatalog(),
  });
});

router.get("/metadata/coverage", asyncRoute(async (req, res) => {
  res.json({
    api: "accidentinfoapi",
    coverage: await getCoverage(),
  });
}));

router.get("/metadata/options", asyncRoute(async (req, res) => {
  res.json({
    api: "accidentinfoapi",
    options: await getFilterOptions(),
  });
}));

router.get("/regions", asyncRoute(async (req, res) => {
  const result = await listRegions(req.query);
  res.json({
    api: "accidentinfoapi",
    count: result.rowCount,
    data: result.rows,
  });
}));

router.get("/regions/:ags", asyncRoute(async (req, res) => {
  const region = await getRegionByAgs(req.params.ags);
  if (!region) {
    return res.status(404).json({
      error: "not_found",
      message: "Region not found.",
    });
  }
  res.json({
    api: "accidentinfoapi",
    data: region,
  });
}));

router.get("/answers/earliest-accident-year", asyncRoute(async (req, res) => {
  res.json({
    api: "accidentinfoapi",
    question: "What is the earliest accident year in the complete dataset?",
    data: await earliestAccidentYear(),
  });
}));

router.get("/answers/available-from", asyncRoute(async (req, res) => {
  const stateAgs = String(req.query.stateAgs || "").trim();
  if (!stateAgs) {
    return res.status(400).json({ error: "invalid_filter", message: "stateAgs is required." });
  }

  res.json({
    api: "accidentinfoapi",
    question: `From which year onwards is data available for ${stateAgs}?`,
    data: await availableFrom(stateAgs),
  });
}));

router.get("/answers/count", asyncRoute(async (req, res) => {
  res.json({
    api: "accidentinfoapi",
    question: "Count accidents with filters.",
    data: await countAccidents(req.query),
  });
}));

router.get("/answers/passenger-car-rate", asyncRoute(async (req, res) => {
  const year = validateYear(req.query.year);
  const limit = req.query.limit ? validateInteger(req.query.limit, "limit", 1, 50) : 10;

  res.json({
    api: "accidentinfoapi",
    question: "Traffic accidents per 100,000 registered passenger cars in a region.",
    data: await passengerCarRate({ year, limit }),
  });
}));

router.get("/answers/top-fatal-districts", asyncRoute(async (req, res) => {
  const year = validateYear(req.query.year);
  const limit = req.query.limit ? validateInteger(req.query.limit, "limit", 1, 20) : 5;

  res.json({
    api: "accidentinfoapi",
    question: "Top districts with highest fatal accidents.",
    data: await topFatalDistricts(year, limit),
  });
}));

router.get("/answers/zero-accident-municipalities", asyncRoute(async (req, res) => {
  const stateAgs = String(req.query.stateAgs || "").trim();
  const year = validateYear(req.query.year);
  if (!stateAgs) {
    return res.status(400).json({ error: "invalid_filter", message: "stateAgs is required." });
  }

  res.json({
    api: "accidentinfoapi",
    question: "Municipalities with zero accidents in a year.",
    data: await zeroAccidentMunicipalities(stateAgs, year),
  });
}));

router.get("/schema-map", (req, res) => {
  res.json({
    api: "accidentinfoapi",
    title: "Schema map",
    tables: [
      {
        table: "regions",
        use: "state, district, municipality lookup and hierarchy",
        keys: ["region_id PK", "ags UNIQUE", "parent_region_id FK"],
      },
      {
        table: "accidents",
        use: "event-level accident answers",
        keys: ["accident_id PK", "source_accident_key UNIQUE", "region_id FK"],
      },
      {
        table: "indicators",
        use: "indicator definitions and labels",
        keys: ["indicator_id PK", "code UNIQUE"],
      },
      {
        table: "indicator_values",
        use: "regional statistics and derived rates",
        keys: ["indicator_value_id PK", "region_id FK", "indicator_id FK", "UNIQUE(region_id, indicator_id, year, month)"],
      },
      {
        table: "import_runs",
        use: "ETL provenance",
        keys: ["import_run_id PK"],
      },
      {
        table: "source_files",
        use: "download provenance",
        keys: ["source_file_id PK", "import_run_id FK"],
      },
    ],
  });
});

module.exports = router;
