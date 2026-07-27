import { useEffect, useMemo, useState } from "react";
import { request } from "../api";
import QuestionForm from "./QuestionForm";
import ResponseFrame from "./ResponseFrame";

function buildInitialValues(fields) {
  return fields.reduce((acc, field) => {
    acc[field.key] = field.defaultValue ?? "";
    return acc;
  }, {});
}

function buildQueryParams(fields, values, fixedParams = {}) {
  const params = new URLSearchParams();
  Object.entries(fixedParams).forEach(([key, value]) => {
    params.set(key, String(value));
  });
  fields.forEach((field) => {
    const value = values[field.key];
    if (field.type === "checkbox") {
      if (value === "true") params.set(field.key, "true");
      return;
    }
    if (value !== "" && value !== null && value !== undefined) {
      params.set(field.key, String(value));
    }
  });
  return params.toString();
}

export default function QuestionConsole({ catalog, options, stateOptions }) {
  const [selectedId, setSelectedId] = useState("");
  const selectedQuestion = useMemo(
    () => catalog.find((question) => question.id === selectedId) || catalog[0] || null,
    [catalog, selectedId]
  );
  const [form, setForm] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (catalog.length && !selectedId) {
      setSelectedId(catalog[0].id);
    }
  }, [catalog, selectedId]);

  useEffect(() => {
    if (selectedQuestion) {
      setForm(buildInitialValues(selectedQuestion.fields || []));
      setResult(null);
      setError("");
    }
  }, [selectedQuestion]);

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function runQuestion(event) {
    event.preventDefault();
    if (!selectedQuestion) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const query = buildQueryParams(selectedQuestion.fields || [], form, selectedQuestion.fixedParams || {});
      const body = await request(`${selectedQuestion.endpoint}${query ? `?${query}` : ""}`);
      setResult(body);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!selectedQuestion) {
    return null;
  }

  return (
    <div className="row g-4">
      <div className="col-xl-5">
        <QuestionForm
          catalog={catalog}
          selectedId={selectedId}
          selectedQuestion={selectedQuestion}
          form={form}
          options={options}
          stateOptions={stateOptions}
          loading={loading}
          onQuestionChange={setSelectedId}
          onFieldChange={updateField}
          onSubmit={runQuestion}
        />
      </div>

      <div className="col-xl-7">
        <div className="card shadow-sm mb-4">
          <div className="card-body">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div>
              <h2 className="h6 mb-1">Response</h2>
            </div>
            <span className="badge text-bg-light">{selectedQuestion.answerShape}</span>
          </div>
          {error ? (
            <pre className="alert alert-danger mb-0">{error}</pre>
          ) : (
            <ResponseFrame result={result} selectedQuestion={selectedQuestion} />
          )}
          </div>
        </div>

        <div className="card shadow-sm">
          <div className="card-body">
            <h2 className="h6 mb-1">How this stays dynamic</h2>
          <ul className="small mb-0 mt-3">
            <li>The list of question types comes from the backend catalog.</li>
            <li>State options come from the live `regions` table.</li>
            <li>The form only sends chosen filters to `AccidentInfoAPI`.</li>
          </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
