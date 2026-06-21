function buildOpenApiSpec(baseUrl = "http://localhost:3000") {
  return {
    openapi: "3.0.3",
    info: {
      title: "AccidentInfoAPI",
      version: "1.0.0",
      description: "API for German traffic accident analytics and provenance-aware regional statistics.",
    },
    servers: [{ url: baseUrl }],
    paths: {
      "/accidentinfoapi/health": {
        get: {
          summary: "Health check",
          responses: { 200: { description: "Server is healthy" } },
        },
      },
      "/accidentinfoapi/metadata/coverage": {
        get: {
          summary: "Dataset coverage and source overview",
          responses: { 200: { description: "Coverage summary" } },
        },
      },
      "/accidentinfoapi/metadata/options": {
        get: {
          summary: "Available frontend dropdown options from the database",
          responses: { 200: { description: "Filter option lists" } },
        },
      },
      "/accidentinfoapi/question-catalog": {
        get: {
          summary: "Question catalog for the frontend",
          responses: { 200: { description: "Question definitions" } },
        },
      },
      "/accidentinfoapi/regions": {
        get: {
          summary: "List regions",
          parameters: [
            { name: "level", in: "query", schema: { type: "string" } },
            { name: "search", in: "query", schema: { type: "string" } },
            { name: "stateAgs", in: "query", schema: { type: "string" } },
          ],
          responses: { 200: { description: "Region list" } },
        },
      },
      "/accidentinfoapi/regions/{ags}": {
        get: {
          summary: "Get a region by AGS",
          parameters: [
            { name: "ags", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            200: { description: "Region found" },
            404: { description: "Region not found" },
          },
        },
      },
      "/accidentinfoapi/answers/earliest-accident-year": {
        get: { summary: "Earliest accident year", responses: { 200: { description: "Answer" } } },
      },
      "/accidentinfoapi/answers/count": {
        get: {
          summary: "Count accidents with filters",
          parameters: [
            { name: "year", in: "query", required: true, schema: { type: "integer" } },
            { name: "stateAgs", in: "query", schema: { type: "string" } },
            { name: "district", in: "query", schema: { type: "string" } },
            { name: "municipality", in: "query", schema: { type: "string" } },
            { name: "regionName", in: "query", schema: { type: "string" } },
            { name: "category", in: "query", schema: { type: "string" } },
            { name: "type", in: "query", schema: { type: "string" } },
            { name: "month", in: "query", schema: { type: "integer", minimum: 1, maximum: 12 } },
            { name: "ags", in: "query", schema: { type: "string" } },
            { name: "personalInjury", in: "query", schema: { type: "boolean" } },
            { name: "pedestrian", in: "query", schema: { type: "boolean" } },
            { name: "bicycle", in: "query", schema: { type: "boolean" } },
            { name: "car", in: "query", schema: { type: "boolean" } },
            { name: "motorcycle", in: "query", schema: { type: "boolean" } },
            { name: "fatal", in: "query", schema: { type: "boolean" } },
          ],
          responses: { 200: { description: "Count result" } },
        },
      },
      "/accidentinfoapi/answers/available-from": {
        get: {
          summary: "Earliest accident year available for a state",
          parameters: [
            { name: "stateAgs", in: "query", required: true, schema: { type: "string" } },
          ],
          responses: { 200: { description: "Year result" } },
        },
      },
      "/accidentinfoapi/answers/passenger-car-rate": {
        get: {
          summary: "Cross-source accident rate per 100,000 passenger cars",
          parameters: [
            { name: "year", in: "query", required: true, schema: { type: "integer" } },
            { name: "limit", in: "query", schema: { type: "integer" } },
          ],
          responses: { 200: { description: "Ranked results" } },
        },
      },
      "/accidentinfoapi/answers/top-fatal-districts": {
        get: {
          summary: "Top fatal districts",
          parameters: [
            { name: "year", in: "query", required: true, schema: { type: "integer" } },
            { name: "limit", in: "query", schema: { type: "integer" } },
          ],
          responses: { 200: { description: "Ranked results" } },
        },
      },
      "/accidentinfoapi/answers/zero-accident-municipalities": {
        get: {
          summary: "Municipalities with zero accidents",
          parameters: [
            { name: "stateAgs", in: "query", required: true, schema: { type: "string" } },
            { name: "year", in: "query", required: true, schema: { type: "integer" } },
          ],
          responses: { 200: { description: "List result" } },
        },
      },
      "/accidentinfoapi/schema-map": {
        get: { summary: "Explain which tables answer which questions", responses: { 200: { description: "Schema map" } } },
      },
    },
  };
}

module.exports = {
  buildOpenApiSpec,
};
