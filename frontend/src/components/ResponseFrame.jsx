function formatCellValue(value) {
  if (value === null || value === undefined || value === "") {
    return "No data";
  }
  return String(value);
}

function ResponseHeader({ selectedQuestion }) {
  return (
    <div className="d-flex align-items-start justify-content-between gap-3">
      <div>
        <h3 className="h6 mb-1">Answer</h3>
        <p className="text-muted small mb-0">{selectedQuestion?.description}</p>
      </div>
    </div>
  );
}

function CountAnswer({ result, selectedQuestion }) {
  return (
    <div className="d-grid gap-3">
      <ResponseHeader selectedQuestion={selectedQuestion} />
      <div className="card bg-light border">
        <div className="card-body">
          <div className="small text-muted mb-1">Result</div>
          <div className="display-5 fw-bold lh-1 text-dark">{formatCellValue(result.data.answer)}</div>
        <div className="text-muted small">Answer calculated by the API from the database.</div>
        </div>
      </div>
      <details>
        <summary className="small text-muted">Show filters and raw response</summary>
        <pre className="bg-dark text-light rounded p-3 mt-2 mb-0 overflow-auto small">{JSON.stringify(result, null, 2)}</pre>
      </details>
    </div>
  );
}

function TableAnswer({ result, selectedQuestion }) {
  const rows = result.data;
  const columns = rows.length ? Object.keys(rows[0]) : [];

  return (
    <div className="d-grid gap-3">
      <ResponseHeader selectedQuestion={selectedQuestion} />
      <div className="table-responsive border rounded bg-white">
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
          <div className="d-flex align-items-center text-muted p-3" style={{ minHeight: "120px" }}>No matching rows found.</div>
        )}
      </div>
      <details>
        <summary className="small text-muted">Show raw API response</summary>
        <pre className="bg-dark text-light rounded p-3 mt-2 mb-0 overflow-auto small">{JSON.stringify(result, null, 2)}</pre>
      </details>
    </div>
  );
}

export default function ResponseFrame({ result, selectedQuestion }) {
  if (!result) {
    return <div className="d-flex align-items-center text-muted" style={{ minHeight: "120px" }}>Run a question to see the answer here.</div>;
  }

  if (result.data?.answer !== undefined) {
    return <CountAnswer result={result} selectedQuestion={selectedQuestion} />;
  }

  if (Array.isArray(result.data)) {
    return <TableAnswer result={result} selectedQuestion={selectedQuestion} />;
  }

  return (
    <div className="d-grid gap-3">
      <ResponseHeader selectedQuestion={selectedQuestion} />
      <pre className="bg-dark text-light rounded p-3 mb-0 overflow-auto small">{JSON.stringify(result, null, 2)}</pre>
    </div>
  );
}
