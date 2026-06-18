import { useEffect, useMemo, useState } from "react";

const CATEGORY_LABELS = {
  1: "Fatal injury accident",
  2: "Serious injury accident",
  3: "Minor injury accident",
};

const TYPE_LABELS = {
  1: "Driving accident",
  2: "Turning accident",
  3: "Crossing accident",
  4: "Pedestrian crossing accident",
  5: "Stationary traffic accident",
  6: "Longitudinal traffic accident",
  7: "Other accident",
};

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

function optionLabel(fieldType, value) {
  if (fieldType === "category-select") {
    return CATEGORY_LABELS[value] ? `${CATEGORY_LABELS[value]} (${value})` : String(value);
  }
  if (fieldType === "type-select") {
    return TYPE_LABELS[value] ? `${TYPE_LABELS[value]} (${value})` : String(value);
  }
  return String(value);
}

function SelectField({ field, value, onChange, options, stateOptions }) {
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
    const states = options?.states?.length ? options.states : stateOptions || [];
    return (
      <select className="form-select" value={value || ""} onChange={(event) => onChange(event.target.value)} required={field.required}>
        <option value="">Select state</option>
        {states.map((state) => (
          <option key={state.ags} value={state.ags}>{state.ags} - {state.name}</option>
        ))}
      </select>
    );
  }

  if (field.type === "region-select") {
    const regions = options?.regions || [];
    return (
      <select
        className="form-select"
        value={value || ""}
        required={field.required}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Select region</option>
        {regions.map((region) => (
          <option key={`${region.level}-${region.ags}`} value={region.name}>
            {region.name} ({region.level})
          </option>
        ))}
      </select>
    );
  }

  const values = lookup[field.type];
  if (values) {
    return (
      <select className="form-select" value={value || ""} onChange={(event) => onChange(event.target.value)} required={field.required}>
        <option value="">Select {field.label.toLowerCase()}</option>
        {values.map((item) => (
          <option key={item} value={item}>{optionLabel(field.type, item)}</option>
        ))}
      </select>
    );
  }

  return null;
}

function formatCellValue(value) {
  if (value === null || value === undefined || value === "") {
    return "No data";
  }
  return String(value);
}

function ResponseFrame({ result, selectedQuestion }) {
  if (!result) {
    return <div className="result-empty">Run a question to see the answer here.</div>;
  }

  if (result.data?.answer !== undefined) {
    return (
      <div className="response-frame">
        <div className="response-head">
          <div>
            <h3 className="h6 mb-1">Answer</h3>
            <p className="text-muted small mb-0">{selectedQuestion?.description}</p>
          </div>
          <span className="badge text-bg-light">{selectedQuestion?.answerShape || "single_value"}</span>
        </div>
        <div className="response-card">
          <div className="response-label">Result</div>
          <div className="answer-number">{formatCellValue(result.data.answer)}</div>
          <div className="text-muted small">Answer calculated by the API from the database.</div>
        </div>
        <details className="response-details mt-3">
          <summary className="small text-muted">Show filters and raw response</summary>
          <pre className="result-box mt-2 mb-0">{JSON.stringify(result, null, 2)}</pre>
        </details>
      </div>
    );
  }

  if (Array.isArray(result.data)) {
    const rows = result.data;
    const columns = rows.length ? Object.keys(rows[0]) : [];
    return (
      <div className="response-frame">
        <div className="response-head">
          <div>
            <h3 className="h6 mb-1">Answer</h3>
            <p className="text-muted small mb-0">{selectedQuestion?.description}</p>
          </div>
          <span className="badge text-bg-light">{selectedQuestion?.answerShape || "table"}</span>
        </div>
        <div className="table-responsive response-table-wrap">
          {rows.length ? (
              <table className="table table-sm table-bordered table-striped table-hover align-middle mb-0">
                <thead>
                  <tr>
                    {columns.map((column) => (
                      <th key={column} scope="col">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={index}>
                      {columns.map((column) => (
                        <td key={column}>{formatCellValue(row[column])}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
          ) : (
            <div className="result-empty">No matching rows found.</div>
          )}
        </div>
        <details className="response-details mt-3">
          <summary className="small text-muted">Show raw API response</summary>
          <pre className="result-box mt-2 mb-0">{JSON.stringify(result, null, 2)}</pre>
        </details>
      </div>
    );
  }

  return (
    <div className="response-frame">
      <div className="response-head">
        <div>
          <h3 className="h6 mb-1">Answer</h3>
          <p className="text-muted small mb-0">{selectedQuestion?.description}</p>
        </div>
      </div>
      <pre className="result-box mb-0">{JSON.stringify(result, null, 2)}</pre>
    </div>
  );
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
                  <select
                    className="form-select"
                    value={form[field.key] || ""}
                    onChange={(event) => updateField(field.key, event.target.value)}
                  >
                    <option value="">Any</option>
                    <option value="true">Yes</option>
                  </select>
                ) : field.type.endsWith("-select") ? (
                  <SelectField
                    field={field}
                    value={form[field.key]}
                    options={options}
                    stateOptions={stateOptions}
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
            <ResponseFrame result={result} selectedQuestion={selectedQuestion} />
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
