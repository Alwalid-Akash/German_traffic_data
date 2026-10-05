const DEFAULT_API_BASE = "https://german-traffic-data.onrender.com";
export const API_BASE = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE).replace(/\/$/, "");

export async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, options);
  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json")
    ? await response.json()
    : { message: await response.text() };

  if (!response.ok) {
    const error = new Error(contentType.includes("application/json") ? (body.message || "The data service could not complete this request.") : "The data service is unavailable. Please try again.");
    error.body = body;
    throw error;
  }
  if (!contentType.includes("application/json")) throw new Error("The data service returned an unexpected response. Please try again.");
  return body;
}

export const api = {
  backendBaseUrl: API_BASE,
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
};
