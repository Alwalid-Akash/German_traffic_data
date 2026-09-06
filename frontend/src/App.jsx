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

  useEffect(() => {
    async function load() {
      try {
        const [catalogResponse, optionsResponse, statesResponse, schemaResponse] =
          await Promise.all([
            api.questionCatalog(),
            api.options(),
            api.states(),
            api.schemaMap(),
          ]);

        setCatalog(catalogResponse.questions || []);
        setOptions(optionsResponse.options || {});
        setStates(statesResponse.data || statesResponse || []);
        setSchemaMap(schemaResponse);
        setStatus("ready");
      } catch (err) {
        setStatus("error");
      }
    }

    load();
  }, []);

  return (
    <div className="min-vh-100 bg-light">
      <AppHeader activeTab={tab} onTabChange={setTab} />

      <main className="container py-4">
        <LoadingMessage status={status} />

        {tab === "query" ? (
          <>
            <DataLicensePanel />
            <QuestionConsole catalog={catalog} stateOptions={states} options={options} />
          </>
        ) : null}
        {tab === "schema" ? <SchemaExplorer schemaMap={schemaMap} /> : null}
        {tab === "about" ? <AboutPage /> : null}
      </main>
    </div>
  );
}
