import { API_BASE } from "../api";

const TABS = [
  { id: "query", label: "Query" },
  { id: "schema", label: "Schema" },
  { id: "about", label: "About" },
];

export default function AppHeader({ activeTab, onTabChange }) {
  return (
    <header className="sticky-top border-bottom bg-white">
      <div className="container py-3">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <h1 className="h4 mb-1">AccidentInfoAPI</h1>
            <div className="text-muted small">
              Dynamic regional accident answers from normalized tables
            </div>
          </div>
          <div className="btn-group" role="tablist" aria-label="Main sections">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`btn btn-sm ${activeTab === item.id ? "btn-dark" : "btn-outline-dark"}`}
                onClick={() => onTabChange(item.id)}
              >
                {item.label}
              </button>
            ))}
            <a
              className="btn btn-sm btn-outline-dark"
              href={`${API_BASE}/api-docs/`}
              target="_blank"
              rel="noreferrer"
            >
              Swagger UI
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
