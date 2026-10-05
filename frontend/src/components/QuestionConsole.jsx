import { useEffect, useMemo, useRef, useState } from "react";
import { request } from "../api";
import QuestionForm from "./QuestionForm";
import ResponseFrame from "./ResponseFrame";

function initialValues(fields, options, states) {
  return Object.fromEntries(fields.map(field => {
    let value = field.defaultValue ?? "";
    const available = field.type === "year-select" ? options?.years :
      field.type === "state-select" ? states.map(state => state.ags) : null;
    if (available && !available.some(item => String(item) === String(value))) {
      value = field.required ? available.at(-1) ?? "" : "";
    }
    return [field.key, value];
  }));
}

function queryParams(question, values) {
  const params = new URLSearchParams(question.fixedParams || {});
  for (const field of question.fields || []) {
    const value = values[field.key];
    if (field.type === "checkbox") {
      if (value === "true") params.set(field.key, "true");
    } else if (value !== "" && value !== undefined && value !== null) {
      params.set(field.key, String(value));
    }
  }
  return params.toString();
}

export default function QuestionConsole({ catalog, options, stateOptions }) {
  const [selectedId, setSelectedId] = useState("");
  const question = useMemo(() => catalog.find(item => item.id === selectedId) || catalog[0], [catalog, selectedId]);
  const [form, setForm] = useState({});
  const [result, setResult] = useState(null);
  const [submitted, setSubmitted] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const controller = useRef(null);

  useEffect(() => {
    controller.current?.abort();
    if (question) setForm(initialValues(question.fields || [], options, stateOptions));
    setResult(null);
    setSubmitted(null);
    setError("");
    setLoading(false);
    return () => controller.current?.abort();
  }, [question, options, stateOptions]);

  function updateField(key, value) {
    setForm(current => ({ ...current, [key]: value }));
    setResult(null);
    setSubmitted(null);
    setError("");
  }

  async function runQuestion(event) {
    event.preventDefault();
    if (!question) return;
    controller.current?.abort();
    const active = new AbortController();
    controller.current = active;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const query = queryParams(question, form);
      const body = await request(question.endpoint + (query ? "?" + query : ""), { signal: active.signal });
      if (active.signal.aborted) return;
      setResult(body);
      setSubmitted({ ...form });
    } catch (err) {
      if (!active.signal.aborted) setError(err.message);
    } finally {
      if (!active.signal.aborted) setLoading(false);
    }
  }

  if (!question) return <p role="status">No questions are currently available.</p>;
  return (
    <div className="row g-4 g-lg-5">
      <div className="col-lg-5 col-xl-4">
        <QuestionForm catalog={catalog} selectedId={question.id} selectedQuestion={question}
          form={form} options={options} stateOptions={stateOptions} loading={loading}
          onQuestionChange={setSelectedId} onFieldChange={updateField} onSubmit={runQuestion} />
      </div>
      <section className="col-lg-7 col-xl-8 answer-section" aria-label="Answer" aria-busy={loading}>
        <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-4">
          <h2 className="h5 mb-0">Your answer</h2>
          {result && <span className="small text-secondary">From imported records</span>}
        </div>
        <div aria-live="polite">
          {loading ? <p role="status" className="py-5"><span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />Finding your answer...</p> :
          error ? <div role="alert" className="alert alert-danger"><h3 className="h6">We couldn't retrieve this answer</h3><p className="mb-0">{error}</p></div> :
          <ResponseFrame result={result} selectedQuestion={question} submitted={submitted} stateOptions={stateOptions} />}
        </div>
      </section>
    </div>
  );
}
