const QUESTION_CATALOG = [
  {
    id: "earliest-accident-year",
    title: "Earliest accident year in the complete dataset",
    description: "Uses all Unfallatlas accident rows and returns MIN(accidents.year).",
    endpoint: "/accidentinfoapi/answers/earliest-accident-year",
    method: "GET",
    fields: [],
    fixedParams: {},
    answerShape: "single_value",
  },
  {
    id: "personal-injury-by-state",
    title: "Personal injury accidents by state and year",
    description: "Answers the Saxony 2023 question, but the state and year are editable.",
    endpoint: "/accidentinfoapi/answers/count",
    method: "GET",
    fields: [
      { key: "year", label: "Year", type: "year-select", required: true, defaultValue: 2023 },
      { key: "stateAgs", label: "Federal state", type: "state-select", required: true, defaultValue: "14" },
    ],
    fixedParams: { personalInjury: "true" },
    answerShape: "count",
  },
  {
    id: "state-availability",
    title: "Data available from year for a state",
    description: "Answers NRW and Mecklenburg-Western Pomerania availability questions.",
    endpoint: "/accidentinfoapi/answers/available-from",
    method: "GET",
    fields: [
      { key: "stateAgs", label: "Federal state", type: "state-select", required: true, defaultValue: "05" },
    ],
    fixedParams: {},
    answerShape: "single_value",
  },
  {
    id: "pedestrian-by-state",
    title: "Pedestrian accidents by state and year",
    description: "Answers the Berlin 2023 pedestrian question, but state and year are editable.",
    endpoint: "/accidentinfoapi/answers/count",
    method: "GET",
    fields: [
      { key: "year", label: "Year", type: "year-select", required: true, defaultValue: 2023 },
      { key: "stateAgs", label: "Federal state", type: "state-select", required: true, defaultValue: "11" },
    ],
    fixedParams: { pedestrian: "true" },
    answerShape: "count",
  },
  {
    id: "passenger-car-rate",
    title: "Traffic accidents per 100,000 passenger cars",
    description: "Cross-source query: Unfallatlas accident counts divided by Regionalatlas passenger-car stock.",
    endpoint: "/accidentinfoapi/answers/passenger-car-rate",
    method: "GET",
    fields: [
      { key: "year", label: "Accident year", type: "year-select", required: true, defaultValue: 2023 },
      { key: "limit", label: "Number of regions", type: "number", min: 1, max: 50, defaultValue: 10 },
    ],
    fixedParams: {},
    answerShape: "table",
  },
  {
    id: "top-fatal-districts",
    title: "Top districts with highest fatal accidents",
    description: "Ranks districts by fatal accident count for the selected year.",
    endpoint: "/accidentinfoapi/answers/top-fatal-districts",
    method: "GET",
    fields: [
      { key: "year", label: "Year", type: "year-select", required: true, defaultValue: 2024 },
      { key: "limit", label: "Number of districts", type: "number", min: 1, max: 20, defaultValue: 5 },
    ],
    fixedParams: {},
    answerShape: "table",
  },
  {
    id: "bicycle-by-region",
    title: "Bicycle accidents by region and year",
    description: "Answers the Dresden 2024 bicycle question, but the region and year are editable.",
    endpoint: "/accidentinfoapi/answers/count",
    method: "GET",
    fields: [
      { key: "year", label: "Year", type: "year-select", required: true, defaultValue: 2024 },
      { key: "regionName", label: "Region", type: "region-select", required: true, defaultValue: "Dresden" },
    ],
    fixedParams: { bicycle: "true" },
    answerShape: "count",
  },
  {
    id: "zero-accident-municipalities",
    title: "Municipalities with zero accidents",
    description: "Answers the Saxony 2023 zero-case question, but state and year are editable.",
    endpoint: "/accidentinfoapi/answers/zero-accident-municipalities",
    method: "GET",
    fields: [
      { key: "stateAgs", label: "Federal state", type: "state-select", required: true, defaultValue: "14" },
      { key: "year", label: "Year", type: "year-select", required: true, defaultValue: 2023 },
    ],
    fixedParams: {},
    answerShape: "list",
  },
  {
    id: "custom-count",
    title: "Simple custom accident count",
    description: "Count accidents for one year. Optionally choose a state, type a region name, and enable simple participant/injury filters.",
    endpoint: "/accidentinfoapi/answers/count",
    method: "GET",
    fields: [
      { key: "year", label: "Year", type: "year-select", required: true, defaultValue: 2023 },
      { key: "stateAgs", label: "Federal state", type: "state-select" },
      { key: "regionName", label: "Region name", type: "region-select" },
      { key: "personalInjury", label: "Personal injury", type: "checkbox" },
      { key: "pedestrian", label: "Pedestrian", type: "checkbox" },
      { key: "bicycle", label: "Bicycle", type: "checkbox" },
      { key: "fatal", label: "Fatal", type: "checkbox" },
    ],
    fixedParams: {},
    answerShape: "count",
  },
];

function getQuestionCatalog() {
  return QUESTION_CATALOG;
}

module.exports = {
  getQuestionCatalog,
};
