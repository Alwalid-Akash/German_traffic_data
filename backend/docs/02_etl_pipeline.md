# ETL and Normalization Documentation

## Overview

The ETL pipeline is implemented in `backend/src/etl/runetl.js`.

It follows this structure:

1. Extract downloaded source files from `backend/data`.
2. Parse source-specific file formats.
3. Transform source rows into a canonical internal model.
4. Load normalized records into PostgreSQL.
5. Aggregate analytical indicators.
6. Store provenance with import run IDs and source file records.

Run ETL with:

```bash
cd backend
npm run init-db
npm run dev
```

Then open:

```text
http://localhost:3000/etl
```

## Extract

The downloader fetches raw files and writes them unchanged into `backend/data`.

Extraction includes:

- Unfallatlas ZIP extraction into `data/extracted`.
- GV-ISys Excel download into `data/downloads`.
- Regionalatlas CSV download into `data/downloads`.

## Parse

Parsers:

| Parser | Input | Output |
| --- | --- | --- |
| `gvisysparser.js` | Excel workbook | GV-ISys rows with Satzart, AGS parts, names, population, coordinates |
| `unfallatlasparser.js` | CSV/TXT accident files | raw Unfallatlas accident records |
| `regionalatlasparser.js` | wide Regionalstatistik CSV files | normalized rows with AGS, year, value |

The Regionalatlas parser handles wide GENESIS exports where metadata/header lines appear before the actual values.

## Transform

Transformers:

| Transformer | Normalization |
| --- | --- |
| `regiontransformer.js` | Builds canonical state, district, and municipality records from official AGS components |
| `accidenttransformer.js` | Normalizes accident date fields, participant flags, category flags, coordinates, and region linkage |
| `regionalatlastransformer.js` | Maps indicator rows to canonical region IDs and keeps yearly indicator values |

## Normalization Decisions

### Regions

GV-ISys rows are converted into one `regions` table:

- `state`
- `district`
- `municipality`

The self-reference `parent_region_id` stores hierarchy:

```text
state -> district -> municipality
```

Official AGS codes are the central join key across all sources.

### Accidents

Unfallatlas events are not stored as raw file rows. They are normalized into `accidents` with:

- year, month, weekday, hour
- category, type, light conditions
- participant flags such as pedestrian, bicycle, car, motorcycle
- injury/fatal flags
- coordinates
- canonical `region_id`

Duplicate detection uses `source_accident_key`, generated from source file path and row number.

### Indicators

Regionalatlas statistical values are split into:

- `indicators`: definition of what the measure means.
- `indicator_values`: region/year/month/value observations.

This avoids creating one table per source file.

## Load

Loaders insert/upsert data into PostgreSQL:

| Loader | Target |
| --- | --- |
| `regionloader.js` | `regions` |
| `accidentloader.js` | `accidents` |
| `regionalatlasloader.js` | `indicators`, `indicator_values`, and region population updates |
| `indicatorloader.js` | base indicator definitions |
| `provenanceloader.js` | `import_runs`, `source_files` |

## Aggregate

`indicatoraggregator.js` computes derived indicators:

- total accidents
- personal injury accidents
- fatal accidents
- pedestrian accidents
- bicycle accidents
- accidents per 100,000 inhabitants
- accidents per 100,000 registered passenger cars

The passenger-car rate is cross-source:

```text
Unfallatlas accident events + Regionalatlas passenger-car stock
```

Accidents are aggregated to district level before joining passenger-car stock, because passenger-car stock is available at district/city level.

## Data Quality Checks

Implemented or supported checks:

- SHA-256 checksums for downloaded files.
- import run status tracking.
- duplicate accident prevention with `source_accident_key`.
- official AGS-based region matching.
- foreign keys between accidents, regions, indicators, source files, and import runs.
- validation in API query filters.
- zero-case analysis using full GV-ISys municipality coverage.
