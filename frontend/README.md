# AccidentInfoAPI Frontend

This is a simple React + Bootstrap client for AccidentInfoAPI.

The frontend is component based and API driven. It does not keep its own hardcoded answer list. Question definitions come from:

`GET /accidentinfoapi/question-catalog`

## Pages

- Query
- Schema
- Docs

## Components

- `App.jsx`: loads backend metadata and controls the active page.
- `components/QuestionConsole.jsx`: renders the dynamic question form from the API catalog.
- `components/SchemaExplorer.jsx`: explains which database tables answer which questions.
- `components/DocsPanel.jsx`: shows API and licensing notes.

## Data flow

```mermaid
flowchart LR
  A[User input] --> B[React form]
  B --> C[/accidentinfoapi]
  C --> D[(PostgreSQL)]
```

## Data licences

The app displays only data coming from official public sources. Licence and reuse terms are governed by the original source portals:

- Unfallatlas / OpenGeodata NRW
- Regionalatlas / Statistikportal
- GV-ISys / Destatis

## Run

```bash
npm install
npm run dev
```

The frontend proxies API requests to `http://localhost:3000`.
