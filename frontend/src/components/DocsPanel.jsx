export default function DocsPanel({ openapi }) {
  return (
    <div className="row g-4">
      <div className="col-xl-8">
        <div className="card shadow-sm">
          <div className="card-body">
            <h2 className="h6 mb-1">Frontend notes</h2>
            <p className="text-muted small mb-3">Simple, beginner-friendly, and fully API-driven.</p>
          <p className="mb-2">This frontend does not hardcode answers. It renders live data returned by AccidentInfoAPI.</p>
          <p className="mb-2">The question catalog, state list, and answer pages all come from backend metadata or live database-backed endpoints.</p>
          <p className="mb-0">Data license and reuse terms follow the original official source portals: Unfallatlas, Regionalatlas, and GV-ISys.</p>
          </div>
        </div>
      </div>

      <div className="col-xl-4">
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <h2 className="h6 mb-1">OpenAPI</h2>
          <pre className="bg-dark text-light rounded p-3 mt-3 mb-0 small overflow-auto">
            {openapi ? JSON.stringify(openapi.info, null, 2) : "Loading..."}
          </pre>
          </div>
        </div>

        <div className="card shadow-sm">
          <div className="card-body">
            <h2 className="h6 mb-1">API base</h2>
          <code>/accidentinfoapi</code>
          </div>
        </div>
      </div>
    </div>
  );
}
