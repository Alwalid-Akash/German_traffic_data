export default function SchemaExplorer({ schemaMap }) {
  return (
    <div className="row g-4">
      <div className="col-12"><h1 className="h3 fw-bold">Database design</h1><p className="text-secondary mb-0">Six connected tables link accident events, regions, statistical measures and import history.</p></div>
      <div className="col-xl-8">
        <section>
          <div>
            <h2 className="h6 mb-1">Schema to answer map</h2>
            <p className="text-muted small mb-3">Which table is used for which answer.</p>
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
        </section>
      </div>

      <div className="col-xl-4">
        <section className="border-start ps-4">
          <div>
            <h2 className="h6 mb-1">Core tables</h2>
          <ul className="small mb-0 mt-3">
            <li><strong>regions</strong>: AGS, names, hierarchy.</li>
            <li><strong>accidents</strong>: event-level Unfallatlas rows.</li>
            <li><strong>indicators</strong> and <strong>indicator_values</strong>: Regionalatlas statistics and rates.</li>
            <li><strong>import_runs</strong> and <strong>source_files</strong>: provenance and reproducibility.</li>
          </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
