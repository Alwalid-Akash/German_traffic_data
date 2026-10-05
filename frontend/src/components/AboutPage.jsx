export default function AboutPage() {
  return (
    <article className="about-page">
      <h1 className="h3 fw-bold mb-3">About AccidentInfoAPI</h1>
      <p className="lead">Official accident and regional statistics, brought together for easier comparison.</p>
      <p>AccidentInfoAPI is a student project for exploring reported traffic accidents in Germany. It connects accident records with official region names and regional statistics so that you can compare places, years and types of involvement.</p>
      <div className="row g-4 mt-2">
        <section className="col-md-6">
          <h2 className="h5">What the results describe</h2>
          <p>Counts refer to accident events in the imported Unfallatlas records, not to the number of people or vehicles involved. Pedestrian and bicycle filters select accidents involving those participants.</p>
          <p>Regional rates combine accident counts with registered passenger-car statistics. Reference years are shown because the sources do not always cover the same period.</p>
        </section>
        <section className="col-md-6">
          <h2 className="h5">Where the data comes from</h2>
          <p>Unfallatlas supplies accident events. GV-ISys supplies official region names and codes. Regionalatlas / Regionalstatistik supplies observations such as registered passenger cars.</p>
          <p>This is an independent application, not an official statistical publication. Source details and licence links are provided below.</p>
        </section>
      </div>
      <section className="border-top pt-4 mt-3">
        <h2 className="h5">From source to answer</h2>
        <ol className="process-list">
          <li><strong>Download:</strong> obtain official files and record source information.</li>
          <li><strong>Prepare:</strong> read the files, normalize fields and match region codes.</li>
          <li><strong>Store:</strong> load the records into a relational PostgreSQL database.</li>
          <li><strong>Answer:</strong> the REST API queries the database using your selected filters.</li>
        </ol>
        <p className="small text-secondary">Built with Node.js, Express, PostgreSQL, React and Bootstrap. The import process can be rerun; reproducibility depends on source versions and compatible file formats.</p>
      </section>
    </article>
  );
}
