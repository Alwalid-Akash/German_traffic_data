# AccidentInfoAPI

Explore German traffic accident counts, regional comparisons and data availability.
The React and Bootstrap frontend reads a Node.js/Express REST API backed by PostgreSQL.
The ETL imports Unfallatlas, GV-ISys and Regionalstatistik data.

## Documentation

- [Final technical guide](backend/docs/Final_Technical_Guide.pdf) - the retained 3 October 2026 architecture snapshot.
- [Database design and relationships](backend/docs/03_database_schema.md).
- [Database schema](backend/pgsql/schemas.sql) - executable schema source.

The guide describes the interface before the latest usability update. Current navigation is Explore accidents, Database design and About; Sources & licences is available on every page.

## Run locally

Configure `backend/.env` with `DATABASE_URL` for your PostgreSQL database.
The current database connection requests SSL; use a compatible database configuration.
Never put database credentials in frontend configuration.

From the project root:

```bash
cd backend
npm install
npm run init-db
npm run download
npm run etl
npm run dev
```

Only run the download and ETL commands when preparing or refreshing data.
Check individual source results and import status; a completed run does not establish complete source coverage.

In `frontend/.env.local`, set:

```dotenv
VITE_API_BASE_URL=http://localhost:3000
```

In another terminal, from the project root:

```bash
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite. The default is http://localhost:5173.
Without the frontend override, the configured Render API is used.
For production, set `VITE_API_BASE_URL` to the backend HTTPS URL before running `npm run build`.

The frontend query catalog is supplied by the backend. Deploy backend catalog wording changes together with the frontend.
Swagger UI is at `/api-docs/`; its current server URL configuration can point to Render even when opened locally.

## Data sources and licences

- [Unfallatlas / OpenGeodata NRW](https://www.opengeodata.nrw.de/produkte/transport_verkehr/unfallatlas/): [Data licence Germany - Attribution 2.0](https://www.govdata.de/dl-de/by-2-0).
- [GV-ISys / Destatis](https://www.destatis.de/DE/Themen/Laender-Regionen/Regionales/Gemeindeverzeichnis/_inhalt.html): consult [Destatis reuse terms](https://www.destatis.de/DE/Service/Impressum/copyright.html) and the source publication.
- [Regionalstatistik](https://www.regionalstatistik.de/genesis/online): consult the source table for licence and attribution requirements.

This independent student application normalizes records and calculates results. Cite the original providers and reference years when reusing results.

## Operational limits

There is no user authentication or role enforcement. Maintenance routes remain unprotected even though the public frontend has no maintenance buttons.
Counts describe imported events, not injured people. Missing coverage can produce zero matches, and passenger-car rates may combine different reference years.
