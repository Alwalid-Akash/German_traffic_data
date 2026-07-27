import { useState } from "react";
import { API_BASE, api } from "../api";

const ACTIONS = [
  {
    id: "health",
    label: "Health",
    description: "Checks if the backend server is running.",
    run: () => api.serverHealth(),
  },
  {
    id: "apiHealth",
    label: "API Health",
    description: "Checks if AccidentInfoAPI is running.",
    run: () => api.health(),
  },
  {
    id: "metadataCoverage",
    label: "Metadata Coverage",
    description: "Shows accident years, region count, indicator codes, and source overview.",
    run: () => api.coverage(),
  },
  {
    id: "projectMetadata",
    label: "Project Metadata",
    description: "Shows project URLs and useful backend routes.",
    run: () => api.projectMetadata(),
  },
  {
    id: "metadataOptions",
    label: "Metadata Options",
    description: "Loads years, states, regions, categories, and types used by the frontend.",
    run: () => api.options(),
  },
  {
    id: "status",
    label: "Pipeline Status",
    description: "Shows server status, last download result, and last ETL result.",
    run: () => api.status(),
  },
  {
    id: "download",
    label: "Download",
    description: "Downloads official source datasets and reuses cached files when possible.",
    run: () => api.download(),
  },
  {
    id: "forceDownload",
    label: "Force Download",
    description: "Downloads official source datasets again, even if local files already exist.",
    run: () => api.forceDownload(),
  },
  {
    id: "etl",
    label: "Run ETL",
    description: "Parses, transforms, loads, aggregates, and stores provenance.",
    run: () => api.runEtl(),
  },
];

function SwaggerButton() {
  return (
    <a
      className="btn btn-outline-dark"
      href={`${API_BASE}/api-docs/`}
      target="_blank"
      rel="noreferrer"
    >
      Open Swagger UI
    </a>
  );
}

export default function BackendTools() {
  const [result, setResult] = useState(null);
  const [activeAction, setActiveAction] = useState("");
  const [error, setError] = useState("");

  async function runAction(action) {
    setActiveAction(action.id);
    setError("");
    setResult(null);

    try {
      const data = await action.run();
      setResult({
        action: action.label,
        backend: API_BASE,
        data,
      });
    } catch (err) {
      setError(err.message);
      setResult(err.body || null);
    } finally {
      setActiveAction("");
    }
  }

  return (
    <div className="row g-4">
      <div className="col-xl-5">
        <div className="card shadow-sm">
          <div className="card-body">
            <h2 className="h6 mb-1">Backend control buttons</h2>
            <p className="text-muted small mb-3">
              These buttons call the backend API endpoints directly and show the response below.
            </p>

            <div className="alert alert-warning small">
              <strong>Note:</strong> Download and ETL can take time because they process official datasets.
            </div>

            <div className="d-grid gap-2">
              {ACTIONS.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  className="btn btn-primary text-start"
                  disabled={Boolean(activeAction)}
                  onClick={() => runAction(action)}
                >
                  <span className="d-block fw-semibold">
                    {activeAction === action.id ? "Running..." : action.label}
                  </span>
                  <span className="d-block small opacity-75">{action.description}</span>
                </button>
              ))}
              <SwaggerButton />
            </div>
          </div>
        </div>
      </div>

      <div className="col-xl-7">
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <div className="d-flex flex-wrap justify-content-between gap-2 mb-3">
              <div>
                <h2 className="h6 mb-1">Backend response</h2>
                <p className="text-muted small mb-0">Backend URL: {API_BASE}</p>
              </div>
              <SwaggerButton />
            </div>

            {error ? <div className="alert alert-danger">{error}</div> : null}

            <pre className="bg-dark text-light rounded p-3 small mb-0 overflow-auto" style={{ minHeight: "320px" }}>
              {result ? JSON.stringify(result, null, 2) : "Click a button to run a backend action."}
            </pre>
          </div>
        </div>

        <div className="card shadow-sm">
          <div className="card-body">
            <h2 className="h6 mb-3">Terminal commands</h2>
            <pre className="bg-light border rounded p-3 small mb-0 overflow-auto">{`cd backend
npm install
npm run init-db
npm run download
npm run etl
npm run dev

cd frontend
npm install
npm run dev
npm run build`}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
