import { useEffect, useState } from "react";
import { api } from "./api";
import QuestionConsole from "./components/QuestionConsole";
import SchemaExplorer from "./components/SchemaExplorer";
import DocsPanel from "./components/DocsPanel";

const TABS = [
  { id: "query", label: "Query" },
  { id: "schema", label: "Schema" },
  { id: "docs", label: "Docs" },
];

export default function App() {
  const [tab, setTab] = useState("query");
  const [catalog, setCatalog] = useState([]);
  const [states, setStates] = useState([]);
  const [options, setOptions] = useState(null);
  const [coverage, setCoverage] = useState(null);
  const [schemaMap, setSchemaMap] = useState(null);
  const [openapi, setOpenapi] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    async function load() {
      try {
        const [catalogResponse, optionsResponse, statesResponse, coverageResponse, schemaResponse, openapiResponse] =
          await Promise.all([
            api.questionCatalog(),
            api.options(),
            api.states(),
            api.coverage(),
            api.schemaMap(),
            api.openapi(),
          ]);

        setCatalog(catalogResponse.questions || []);
        setOptions(optionsResponse.options || {});
        setStates(statesResponse.data || statesResponse || []);
        setCoverage(coverageResponse.coverage || coverageResponse);
        setSchemaMap(schemaResponse);
        setOpenapi(openapiResponse);
        setStatus("ready");
      } catch (err) {
        setStatus("error");
      }
    }

    load();
  }, []);

  return (
    <div className="app-shell">
      <header className="topbar border-bottom bg-white">
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
                  className={`btn btn-sm ${tab === item.id ? "btn-dark" : "btn-outline-dark"}`}
                  onClick={() => setTab(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="container py-4">
        {status === "loading" ? (
          <div className="panel">Loading metadata...</div>
        ) : status === "error" ? (
          <div className="panel text-danger">
            Could not load backend metadata. Check that the backend is running on port 3000.
          </div>
        ) : null}

        {tab === "query" ? <QuestionConsole catalog={catalog} stateOptions={states} options={options} /> : null}
        {tab === "schema" ? <SchemaExplorer schemaMap={schemaMap} coverage={coverage} /> : null}
        {tab === "docs" ? <DocsPanel openapi={openapi} /> : null}
      </main>
    </div>
  );
}
