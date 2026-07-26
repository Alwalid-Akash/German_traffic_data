export default function LoadingMessage({ status }) {
  if (status === "loading") {
    return <div className="card card-body shadow-sm">Loading metadata...</div>;
  }

  if (status === "error") {
    return (
      <div className="alert alert-danger border">
        Could not load backend metadata. Check that the backend is running on port 3000.
      </div>
    );
  }

  return null;
}
