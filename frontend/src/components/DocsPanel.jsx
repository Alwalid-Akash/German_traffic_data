export default function DocsPanel({ openapi }) {
  return (
    <div className="row g-4">
      <div className="col-xl-8">
        <div className="panel">
          <div className="panel-header">
            <h2 className="h6 mb-1">Frontend notes</h2>
            <p className="text-muted small mb-0">Simple, beginner-friendly, and fully API-driven.</p>
          </div>
          <p className="mb-2">This frontend does not hardcode answers. It renders live data returned by AccidentInfoAPI.</p>
          <p className="mb-2">The question catalog, state list, and answer pages all come from backend metadata or live database-backed endpoints.</p>
          <p className="mb-0">Data license and reuse terms follow the original official source portals: Unfallatlas, Regionalatlas, and GV-ISys.</p>
        </div>
      </div>

      <div className="col-xl-4">
        <div className="panel mb-4">
          <div className="panel-header">
            <h2 className="h6 mb-1">OpenAPI</h2>
          </div>
          <pre className="result-box mb-0 small">
            {openapi ? JSON.stringify(openapi.info, null, 2) : "Loading..."}
          </pre>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2 className="h6 mb-1">API base</h2>
          </div>
          <code>/accidentinfoapi</code>
        </div>
      </div>
    </div>
  );
}
