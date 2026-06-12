import { useEffect, useMemo, useState } from "react";
import { api } from "../api";

function buildInitialValues(fields) {
  return fields.reduce((acc, field) => {
    acc[field.key] = field.defaultValue ?? (field.type === "checkbox" ? false : "");
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
      if (value) params.set(field.key, "true");
      return;
    }
    if (value !== "" && value !== null && value !== undefined) {
      params.set(field.key, String(value));
    }
  });
  return params.toString();
}

function optionLabel(value) {
  return String(value);
}

function SelectField({ field, value, onChange, options }) {
  const lookup = {
    "year-select": options?.years || [],
    "month-select": options?.months || [],
    "hour-select": options?.hours || [],
    "category-select": options?.categories || [],
    "type-select": options?.types || [],
  };

  if (field.type === "weekday-select") {
    return (
      <select className="form-select" value={value || ""} onChange={(event) => onChange(event.target.value)} required={field.required}>
        <option value="">Select weekday</option>
        {(options?.weekdays || []).map((item) => (
          <option key={item.value} value={item.value}>{item.label}</option>
        ))}
      </select>
    );
  }

  if (field.type === "state-select") {
    return (
      <select className="form-select" value={value || ""} onChange={(event) => onChange(event.target.value)} required={field.required}>
        <option value="">Select state</option>
        {(options?.states || []).map((state) => (
          <option key={state.ags} value={state.ags}>{state.ags} - {state.name}</option>
        ))}
      </select>
    );
  }

  if (field.type === "region-select") {
    return (
      <>
        <input
          className="form-control"
          list="available-regions"
          value={value || ""}
          required={field.required}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Start typing a region name"
        />
        <datalist id="available-regions">
          {(options?.regions || []).map((region) => (
            <option key={`${region.level}-${region.ags}`} value={region.name}>
              {region.ags} - {region.level}
            </option>
          ))}
        </datalist>
      </>
    );
  }

  const values = lookup[field.type];
  if (values) {
    return (
      <select className="form-select" value={value || ""} onChange={(event) => onChange(event.target.value)} required={field.required}>
        <option value="">Select {field.label.toLowerCase()}</option>
        {values.map((item) => (
          <option key={item} value={item}>{optionLabel(item)}</option>
        ))}
      </select>
    );
  }

  return null;
}

export default function QuestionConsole({ catalog, options }) {
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
      const response = await fetch(
        `${selectedQuestion.endpoint}${query ? `?${query}` : ""}`
      );
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.message || "Request failed");
      }
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
        <div className="panel">
          <div className="panel-header">
            <h2 className="h6 mb-1">Question Builder</h2>
            <p className="text-muted small mb-0">Choose a question and fill only the fields you need.</p>
          </div>

          <div className="mb-3">
            <label className="form-label">Question</label>
            <select
              className="form-select"
              value={selectedId}
              onChange={(event) => setSelectedId(event.target.value)}
            >
              {catalog.map((question) => (
                <option key={question.id} value={question.id}>
                  {question.title}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3 small text-muted">{selectedQuestion.description}</div>

          <form onSubmit={runQuestion}>
            {(selectedQuestion.fields || []).map((field) => (
              <div className="mb-3" key={field.key}>
                <label className="form-label">{field.label}</label>
                {field.type === "checkbox" ? (
                  <div className="form-check">
                    <input
                      id={field.key}
                      className="form-check-input"
                      type="checkbox"
                      checked={Boolean(form[field.key])}
                      onChange={(event) => updateField(field.key, event.target.checked)}
                    />
                    <label className="form-check-label" htmlFor={field.key}>
                      Enable
                    </label>
                  </div>
                ) : field.type.endsWith("-select") ? (
                  <SelectField
                    field={field}
                    value={form[field.key]}
                    options={options}
                    onChange={(value) => updateField(field.key, value)}
                  />
                ) : (
                  <input
                    className="form-control"
                    type={field.type}
                    min={field.min}
                    max={field.max}
                    required={field.required}
                    value={form[field.key] || ""}
                    placeholder={field.hint || ""}
                    onChange={(event) => updateField(field.key, event.target.value)}
                  />
                )}
                {field.hint ? <div className="form-hint">{field.hint}</div> : null}
              </div>
            ))}

            <button className="btn btn-primary w-100" disabled={loading}>
              {loading ? "Running..." : "Run query"}
            </button>
          </form>
        </div>
      </div>

      <div className="col-xl-7">
        <div className="panel mb-4">
          <div className="panel-header d-flex align-items-center justify-content-between">
            <div>
              <h2 className="h6 mb-1">Response</h2>
              <p className="text-muted small mb-0">Live data from the API, not hardcoded text.</p>
            </div>
            <span className="badge text-bg-light">{selectedQuestion.answerShape}</span>
          </div>
          {error ? (
            <pre className="result-box text-danger mb-0">{error}</pre>
          ) : (
            <pre className="result-box mb-0">
              {result ? JSON.stringify(result, null, 2) : "Run a question to see the answer here."}
            </pre>
          )}
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2 className="h6 mb-1">How this stays dynamic</h2>
          </div>
          <ul className="small mb-0">
            <li>The list of question types comes from the backend catalog.</li>
            <li>State options come from the live `regions` table.</li>
            <li>The form only sends chosen filters to `AccidentInfoAPI`.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
