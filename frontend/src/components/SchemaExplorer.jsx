export default function SchemaExplorer({ schemaMap }) {
  return (
    <div className="row g-4">
      <div className="col-xl-8">
        <div className="panel">
          <div className="panel-header">
            <h2 className="h6 mb-1">Schema to answer map</h2>
            <p className="text-muted small mb-0">Which table is used for which answer.</p>
          </div>
          <div className="table-responsive">
            <table className="table table-sm align-middle mb-0">
              <thead>
                <tr>
                  <th>Table</th>
                  <th>Use</th>
                  <th>Keys</th>
                </tr>
              </thead>
              <tbody>
                {(schemaMap?.tables || []).map((row) => (
                  <tr key={row.table}>
                    <td>{row.table}</td>
                    <td>{row.use}</td>
                    <td>{row.keys.join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="col-xl-4">
        <div className="panel mb-4">
          <div className="panel-header">
            <h2 className="h6 mb-1">Core tables</h2>
          </div>
          <ul className="small mb-0">
            <li><strong>regions</strong>: AGS, names, hierarchy.</li>
            <li><strong>accidents</strong>: event-level Unfallatlas rows.</li>
            <li><strong>indicators</strong> and <strong>indicator_values</strong>: Regionalatlas statistics and rates.</li>
            <li><strong>import_runs</strong> and <strong>source_files</strong>: provenance and reproducibility.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
