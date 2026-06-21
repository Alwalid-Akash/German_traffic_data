const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

async function request(path) {
  const response = await fetch(`${API_BASE}${path}`);
  const body = await response.json();
  if (!response.ok) {
    const error = new Error(body.message || "Request failed");
    error.body = body;
    throw error;
  }
  return body;
}

export const api = {
  health: () => request("/accidentinfoapi/health"),
  coverage: () => request("/accidentinfoapi/metadata/coverage"),
  options: () => request("/accidentinfoapi/metadata/options"),
  questionCatalog: () => request("/accidentinfoapi/question-catalog"),
  states: () => request("/accidentinfoapi/regions?level=state"),
  regions: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/accidentinfoapi/regions${query ? `?${query}` : ""}`);
  },
  regionByAgs: (ags) => request(`/accidentinfoapi/regions/${encodeURIComponent(ags)}`),
  earliestYear: () => request("/accidentinfoapi/answers/earliest-accident-year"),
  availableFrom: (stateAgs) =>
    request(`/accidentinfoapi/answers/available-from?stateAgs=${encodeURIComponent(stateAgs)}`),
  count: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/accidentinfoapi/answers/count?${query}`);
  },
  passengerCarRate: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/accidentinfoapi/answers/passenger-car-rate?${query}`);
  },
  topFatalDistricts: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/accidentinfoapi/answers/top-fatal-districts?${query}`);
  },
  zeroAccidentMunicipalities: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/accidentinfoapi/answers/zero-accident-municipalities?${query}`);
  },
  schemaMap: () => request("/accidentinfoapi/schema-map"),
  openapi: () => request("/accidentinfoapi/openapi.json"),
};
