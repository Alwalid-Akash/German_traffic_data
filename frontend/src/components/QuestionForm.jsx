import SelectField from "./SelectField";

export default function QuestionForm({
  catalog,
  selectedId,
  selectedQuestion,
  form,
  options,
  stateOptions,
  loading,
  onQuestionChange,
  onFieldChange,
  onSubmit,
}) {
  return (
    <section className="query-form" aria-labelledby="question-heading">
        <h2 id="question-heading" className="h5 mb-3">Your question</h2>
      <fieldset disabled={loading}>

        <div className="mb-3">
          <label className="form-label" htmlFor="question">Question</label>
          <select id="question" className="form-select" value={selectedId} onChange={(event) => onQuestionChange(event.target.value)}>
            {catalog.map((question) => (
              <option key={question.id} value={question.id}>
                {question.shortTitle || question.title}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3 small text-muted">{selectedQuestion.description}</div>

        <form onSubmit={onSubmit}>
          {(selectedQuestion.fields || []).map((field) => (
            <div className="mb-3" key={field.key}>
              <label className="form-label" htmlFor={`field-${field.key}`}>{field.label}{!field.required && field.type !== "checkbox" ? <span className="text-secondary small"> (optional)</span> : null}</label>
              {field.type === "checkbox" ? (
                <select id={`field-${field.key}`} className="form-select" value={form[field.key] || ""} onChange={(event) => onFieldChange(field.key, event.target.value)}>
                  <option value="">Any</option>
                  <option value="true">Yes</option>
                </select>
              ) : field.type.endsWith("-select") ? (
                <SelectField
                  field={field}
                  value={form[field.key]}
                  options={options}
                  stateOptions={stateOptions}
                  onChange={(value) => onFieldChange(field.key, value)}
                />
              ) : (
                <input
                  className="form-control"
                  id={`field-${field.key}`}
                  type={field.type}
                  min={field.min}
                  max={field.max}
                  required={field.required}
                  value={form[field.key] || ""}
                  placeholder={field.hint || ""}
                  onChange={(event) => onFieldChange(field.key, event.target.value)}
                />
              )}
              {field.hint ? <div className="form-text">{field.hint}</div> : null}
            </div>
          ))}

          <button className="btn btn-primary w-100" disabled={loading}>
            {loading ? "Finding answer..." : "Show answer"}
          </button>
        </form>
      </fieldset>
    </section>
  );
}
