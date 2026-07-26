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
    <div className="card shadow-sm">
      <div className="card-body">
        <h2 className="h6 mb-1">Question Builder</h2>
        <p className="text-muted small mb-3">Choose a question and fill only the fields you need.</p>

        <div className="mb-3">
          <label className="form-label">Question</label>
          <select className="form-select" value={selectedId} onChange={(event) => onQuestionChange(event.target.value)}>
            {catalog.map((question) => (
              <option key={question.id} value={question.id}>
                {question.title}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3 small text-muted">{selectedQuestion.description}</div>

        <form onSubmit={onSubmit}>
          {(selectedQuestion.fields || []).map((field) => (
            <div className="mb-3" key={field.key}>
              <label className="form-label">{field.label}</label>
              {field.type === "checkbox" ? (
                <select className="form-select" value={form[field.key] || ""} onChange={(event) => onFieldChange(field.key, event.target.value)}>
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
            {loading ? "Running..." : "Run query"}
          </button>
        </form>
      </div>
    </div>
  );
}
