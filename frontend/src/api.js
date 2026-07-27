const API_BASE = import.meta.env.VITE_API_URL;

async function request(path) {
  try {
    const response = await fetch(`${API_BASE}${path}`);

    const body = await response.json();

    if (!response.ok) {
      throw new Error(body.message || "Request failed");
    }

    return body;

  } catch (error) {
    console.error(error);
    throw error;
  }
}


export const api = {

  health: () =>
    request("/accidentinfoapi/health"),

  coverage: () =>
    request("/accidentinfoapi/metadata/coverage"),

  options: () =>
    request("/accidentinfoapi/metadata/options"),

  questionCatalog: () =>
    request("/accidentinfoapi/question-catalog"),

  states: () =>
    request("/accidentinfoapi/regions?level=state"),

  regions: (params = {}) => {
    const query = new URLSearchParams(params).toString();

    return request(
      `/accidentinfoapi/regions${query ? `?${query}` : ""}`
    );
  },

  count: (params = {}) => {
    const query = new URLSearchParams(params).toString();

    return request(
      `/accidentinfoapi/answers/count?${query}`
    );
  }

};