export default function DataLicensePanel() {
  return (
    <footer id="data-licences" className="border-top bg-white mt-5 py-4">
      <div className="container">
        <h2 className="h6 fw-bold">Data sources &amp; licences</h2>
        <div className="row g-3 small mt-1">
          <div className="col-md-4">
            <a href="https://www.opengeodata.nrw.de/produkte/transport_verkehr/unfallatlas/">Unfallatlas</a>
            <p className="text-secondary mb-1">Accident records from the statistical offices of Germany, distributed by OpenGeodata NRW.</p>
            <a href="https://www.govdata.de/dl-de/by-2-0">Data licence Germany - Attribution 2.0</a>
          </div>
          <div className="col-md-4">
            <a href="https://www.destatis.de/DE/Themen/Laender-Regionen/Regionales/Gemeindeverzeichnis/_inhalt.html">GV-ISys / Destatis</a>
            <p className="text-secondary mb-1">Official region names, administrative codes and hierarchy.</p>
            <a href="https://www.destatis.de/DE/Service/Impressum/copyright.html">Destatis reuse terms</a>
          </div>
          <div className="col-md-4">
            <a href="https://www.regionalstatistik.de/genesis/online">Regionalatlas / Regionalstatistik</a>
            <p className="text-secondary mb-1">Regional statistics from the statistical offices of Germany, including registered passenger cars.</p>
            <span>Consult the source table for its licence and attribution requirements.</span>
          </div>
        </div>
        <p className="small text-secondary mb-0 mt-3">Independent student project. Records are normalized and results calculated by AccidentInfoAPI. When reusing results, cite the original providers and relevant dataset years; the original source terms apply.</p>
      </div>
    </footer>
  );
}
