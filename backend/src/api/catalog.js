const QUESTION_CATALOG = [
  {
    id: "earliest-accident-year",
    shortTitle: "First available year",
    title: "What is the first available accident year?",
    description: "The earliest year found across the imported accident records.",
    endpoint: "/accidentinfoapi/answers/earliest-accident-year",
    method: "GET",
    fields: [],
    fixedParams: {},
    answerShape: "single_value",
  },
  {
    id: "personal-injury-by-state",
    shortTitle: "Injury accident count",
    title: "How many injury accidents occurred?",
    description: "Accidents involving personal injury in a federal state and year.",
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
    shortTitle: "State data availability",
    title: "When do records begin for a state?",
    description: "The first imported accident year for the selected federal state.",
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
    shortTitle: "Pedestrian accident count",
    title: "How many accidents involved pedestrians?",
    description: "Accident events involving pedestrians, by federal state and year.",
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
    shortTitle: "Accidents per 100,000 cars",
    title: "Traffic accidents per 100,000 passenger cars",
    description: "Compare regional accident counts relative to registered passenger cars. Reference years may differ.",
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
    shortTitle: "Fatal accident ranking",
    title: "Which districts had the most fatal accidents?",
    description: "Regions ranked by the number of fatal accident events in a year.",
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
    id: "zero-accident-municipalities",
    shortTitle: "Municipalities with no records",
    title: "Which municipalities have no recorded accidents?",
    description: "Municipalities with no matching imported events. Missing coverage can also produce a zero result.",
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
    shortTitle: "Custom accident count",
    title: "Count accidents by place and involvement",
    description: "Accidents matching a year, optional place and involvement filters. Multiple filters must all match.",
    endpoint: "/accidentinfoapi/answers/count",
    method: "GET",
    fields: [
      { key: "year", label: "Year", type: "year-select", required: true, defaultValue: 2023 },
      { key: "stateAgs", label: "Federal state", type: "state-select" },
      { key: "regionName", label: "Region name", type: "text", hint: "Example: Dresden, Berlin, Leipzig" },
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
