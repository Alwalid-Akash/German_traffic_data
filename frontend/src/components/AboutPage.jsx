const sourceRows = [
  ["Unfallatlas", "Accident event rows", "accidents"],
  ["GV-ISys / Destatis", "Official AGS regions and hierarchy", "regions"],
  ["Regionalatlas / Regionalstatistik", "Regional indicators such as passenger cars", "indicators, indicator_values"],
];

const technologyRows = [
  ["Node.js", "Runs backend server and ETL scripts"],
  ["Express.js", "Creates AccidentInfoAPI routes and JSON responses"],
  ["PostgreSQL", "Stores normalized relational data with joins and foreign keys"],
  ["pg", "Connects Node.js to PostgreSQL"],
  ["React", "Builds the component-based frontend"],
  ["Bootstrap", "Provides clean forms, tables, layout, and buttons"],
];

const schemaRows = [
  ["regions", "State, district, municipality names, AGS codes, hierarchy"],
  ["accidents", "One normalized Unfallatlas accident event per row"],
  ["indicators", "Names and definitions of statistical indicators"],
  ["indicator_values", "Indicator values by region and year"],
  ["source_files", "Source URLs, file names, checksums, dataset codes"],
  ["import_runs", "ETL run timestamps and status"],
];

function InfoTable({ columns, rows }) {
  return (
    <div className="table-responsive">
      <table className="table table-sm align-middle mb-0">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.join("-")}>
              {row.map((cell) => (
                <td key={cell}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AboutPage() {
  return (
    <div className="row g-4">
      <div className="col-xl-7">
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <h2 className="h6 mb-1">Project overview</h2>
            <p className="text-muted small mb-3">
              A reproducible data integration and analytics system for German traffic accident data.
            </p>
          <p>
            AccidentInfoAPI combines multiple official datasets into one normalized
            PostgreSQL database. The frontend does not calculate answers itself.
            It sends selected filters to the backend API, and the API returns
            answers calculated from the database.
          </p>
          <div className="row g-2 text-center small fw-semibold">
            {["Official sources", "ETL", "PostgreSQL", "API", "React UI"].map((item) => (
              <div className="col-12 col-md" key={item}>
                <div className="border rounded bg-light p-3 h-100 d-flex align-items-center justify-content-center">
                  {item}
                </div>
              </div>
            ))}
          </div>
          </div>
        </div>

        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <h2 className="h6 mb-1">Data sources</h2>
            <div className="mt-3">
          <InfoTable columns={["Source", "Purpose", "Main table"]} rows={sourceRows} />
            </div>
          </div>
        </div>

        <div className="card shadow-sm">
          <div className="card-body">
            <h2 className="h6 mb-1">Technology choices</h2>
            <div className="mt-3">
          <InfoTable columns={["Technology", "Why it is used"]} rows={technologyRows} />
            </div>
          </div>
        </div>
      </div>

      <div className="col-xl-5">
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <h2 className="h6 mb-1">How the system works</h2>
          <ol className="small mb-0 mt-3">
            <li>Official data files are downloaded by the ETL extractor.</li>
            <li>Parsers read CSV, TXT, and Excel files.</li>
            <li>Transformers normalize regions, accident flags, years, and indicators.</li>
            <li>Loaders save normalized rows into PostgreSQL.</li>
            <li>The API reads PostgreSQL and returns JSON answers.</li>
            <li>The React frontend displays the answer to the user.</li>
          </ol>
          </div>
        </div>

        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <h2 className="h6 mb-1">Normalized schema</h2>
            <div className="mt-3">
          <InfoTable columns={["Table", "Meaning"]} rows={schemaRows} />
            </div>
          </div>
        </div>

        <div className="card shadow-sm">
          <div className="card-body">
            <h2 className="h6 mb-1">Reproducibility</h2>
          <p className="small mb-2">
            If local data is deleted, the project can download official files again
            and rebuild the normalized database.
          </p>
          <pre className="bg-dark text-light rounded p-3 small mb-0 overflow-auto">{`cd backend
npm run init-db
npm run download
npm run etl
npm run dev`}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
