const labels = {
  district_name: "District", accident_year: "Accident year", passenger_car_year: "Car stock year",
  accident_count: "Accidents", passenger_cars: "Registered cars",
  accidents_per_100k_passenger_cars: "Accidents per 100,000 cars",
  fatal_accidents: "Fatal accidents", ags: "Region code", name: "Municipality",
};
const numberFormat = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 2 });

function display(value, key = "") {
  if (value === null || value === undefined || value === "") return "Not available";
  if (key.includes("year") || key === "ags") return String(value);
  if (typeof value === "number" || (typeof value === "string" && /^-?\d+(\.\d+)?$/.test(value))) return numberFormat.format(Number(value));
  return String(value);
}

export default function ResponseFrame({ result, selectedQuestion, submitted, stateOptions = [] }) {
  if (!result) return <div className="answer-empty py-5">
    <h3 className="h5">Explore the available records</h3>
    <p className="text-secondary mb-0">Accident counts, first available years and regional comparisons.</p>
  </div>;

  const data = result.data;
  const filters = result.data?.filters || submitted || {};
  const state = stateOptions.find(item => item.ags === filters.stateAgs)?.name;
  const context = [filters.year, state, filters.regionName].filter(Boolean).join(" · ");
  const rows = Array.isArray(data) ? data : null;
  const scalarKey = ["answer", "earliest_accident_year", "available_from_year"].find(key => data && Object.hasOwn(data, key));
  const mismatch = rows?.some(row => row.accident_year != null && row.passenger_car_year != null && Number(row.accident_year) !== Number(row.passenger_car_year));
  const columns = rows?.length ? Object.keys(rows[0]) : [];
  return (
    <div>
      <h3 className="h6 fw-bold">{selectedQuestion.title}</h3>
      {context && <p className="text-secondary">{context}</p>}
      {scalarKey ? <div className="py-4">
        <div className="answer-number">{display(data[scalarKey], scalarKey)}</div>
        <p className="text-secondary mt-2 mb-0">{scalarKey === "answer" ? "Matching accident events" : "First year found in the imported records"}</p>
        {data[scalarKey] === null && <p className="small mt-2">No matching records are available for this selection.</p>}
      </div> : rows ? <>
        {mismatch && <div className="alert alert-warning small">Different reference years: some car-stock figures are from a different year than the accidents. Both years are shown below.</div>}
        {selectedQuestion.id === "passenger-car-rate" && <p className="small text-secondary">Accidents ÷ registered passenger cars × 100,000. Regions without car-stock data are not included.</p>}
        {rows.length ? <div className="table-responsive result-table my-3" tabIndex={0} aria-label="Answer results">
          <table className="table table-hover align-middle mb-0">
            <caption className="caption-top small">{rows.length} {rows.length === 1 ? "region" : "regions"} returned</caption>
            <thead><tr>{columns.map(column => <th key={column} scope="col">{labels[column] || column.replaceAll("_", " ")}</th>)}</tr></thead>
            <tbody>{rows.map((row, index) => <tr key={row.ags || index}>{columns.map(column => <td key={column}>{display(row[column], column)}</td>)}</tr>)}</tbody>
          </table>
        </div> : <p className="py-4 text-secondary">No matching regions were returned. Data may be unavailable for this selection.</p>}
      </> : <p>No recognizable answer was returned by the data service.</p>}
      <p className="small text-secondary border-top pt-3 mt-3">
        {selectedQuestion.id === "zero-accident-municipalities" ? "Zero means no matching imported records. Check coverage before concluding that no accidents occurred." :
        scalarKey === "answer" || selectedQuestion.id === "top-fatal-districts" ? "Counts represent accident events, not the number of people injured or killed." :
        "Results depend on the years and regions included in the imported datasets."}
      </p>
      <details className="mt-4 small">
        <summary>Technical response</summary>
        <pre className="bg-light border rounded p-3 mt-2 raw-response">{JSON.stringify(result, null, 2)}</pre>
      </details>
    </div>
  );
}
