import { API_BASE } from "../api";

const TABS = [
  { id: "query", label: "Explore accidents" },
  { id: "schema", label: "Database design" },
  { id: "about", label: "About" },
];

export default function AppHeader({ activeTab, onTabChange }) {
  return (
    <header className="border-bottom bg-white">
      <div className="container py-3">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <div className="h5 fw-bold mb-1">AccidentInfoAPI</div>
            <div className="text-muted small">
              German traffic accident statistics
            </div>
          </div>
          <nav className="d-flex flex-wrap gap-2" aria-label="Main navigation">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`btn btn-sm ${activeTab === item.id ? "btn-dark" : "btn-outline-dark"}`}
                aria-current={activeTab === item.id ? "page" : undefined}
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
              API explorer
            </a>
            <a className="btn btn-sm btn-link" href="#data-licences">Sources &amp; licences</a>
          </nav>
        </div>
      </div>
    </header>
  );
}
