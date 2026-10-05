export default function LoadingMessage({ status, onRetry }) {
  if (status === "loading") return <p role="status" className="py-4 text-secondary"><span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />Loading available questions and regions...</p>;
  if (status !== "error") return null;
  return <div className="alert alert-danger" role="alert">
    <h2 className="h6">Statistics are temporarily unavailable</h2>
    <p>The data service could not be reached. Please try again in a moment.</p>
    <button className="btn btn-outline-danger btn-sm" onClick={onRetry}>Try again</button>
  </div>;
}
