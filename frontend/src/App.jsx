import { useEffect, useState } from "react";
import { api } from "./api";
import AboutPage from "./components/AboutPage";
import AppHeader from "./components/AppHeader";
import DataLicensePanel from "./components/DataLicensePanel";
import LoadingMessage from "./components/LoadingMessage";
import QuestionConsole from "./components/QuestionConsole";
import SchemaExplorer from "./components/SchemaExplorer";

export default function App() {
  const [tab, setTab] = useState("query");
  const [catalog, setCatalog] = useState([]);
  const [states, setStates] = useState([]);
  const [options, setOptions] = useState(null);
  const [schemaMap, setSchemaMap] = useState(null);
  const [status, setStatus] = useState("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    async function load() {
      setStatus("loading");
      try {
        const [catalogResponse, optionsResponse, statesResponse, schemaResponse] =
          await Promise.all([
            api.questionCatalog(),
            api.options(),
            api.states(),
            api.schemaMap(),
          ]);

        if (!active) return;
        setCatalog(catalogResponse.questions || []);
        setOptions(optionsResponse.options || {});
        setStates(statesResponse.data || statesResponse || []);
        setSchemaMap(schemaResponse);
        setStatus("ready");
      } catch (err) {
        if (!active) return;
        setStatus("error");
      }
    }

    load();
    return () => { active = false; };
  }, [attempt]);

  return (
    <div className="min-vh-100 bg-light">
      <AppHeader activeTab={tab} onTabChange={setTab} />

      <main className="container py-4">
        {tab === "query" ? (
          <>
            <div className="mb-4">
              <h1 className="h3 fw-bold">Explore traffic accidents in Germany</h1>
              <p className="text-secondary mb-1">Accident counts, regional comparisons and data availability from official German statistics.</p>
              <p className="small text-secondary mb-0">Results describe imported accident records. Coverage can differ by region and year.</p>
            </div>
            <LoadingMessage status={status} onRetry={() => setAttempt(value => value + 1)} />
            {status === "ready" && <QuestionConsole catalog={catalog} stateOptions={states} options={options} />}
          </>
        ) : null}
        {tab === "schema" ? <><LoadingMessage status={status} onRetry={() => setAttempt(value => value + 1)} />{status === "ready" && <SchemaExplorer schemaMap={schemaMap} />}</> : null}
        {tab === "about" ? <AboutPage /> : null}
      </main>
      <DataLicensePanel />
    </div>
  );
}
