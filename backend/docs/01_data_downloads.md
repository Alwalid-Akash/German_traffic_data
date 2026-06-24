# Dataset Download Documentation

## Purpose

The project is designed for reproducible data integration. If `backend/data` is deleted, the source files can be downloaded again from official sources with:

```bash
cd backend
npm run download
```

The downloader stores raw files under `backend/data/downloads`, extracted Unfallatlas ZIP contents under `backend/data/extracted`, source metadata under `backend/data/metadata`, and a project manifest under `backend/data/manifest`.

## Download Code Location

The reproducible download step is implemented in the extractor layer:

| File | Purpose |
| --- | --- |
| `backend/src/etl/extractors/downloadhelper.js` | Main download controller. It runs all source-specific extractors and creates the download manifest. |
| `backend/src/etl/extractors/downloader.js` | Shared helper for downloading files, reusing cached files, extracting ZIP files, calculating SHA-256 checksums, and saving metadata. |
| `backend/src/etl/extractors/core/unfallatlas.js` | Unfallatlas source-specific download logic. |
| `backend/src/etl/extractors/core/gvisys.js` | GV-ISys source-specific download logic. |
| `backend/src/etl/extractors/core/regionalatlas.js` | Regionalatlas source-specific download logic. |

## Core Analytical Datasets

### Unfallatlas

- Role: accident event data.
- Source portal: https://www.opengeodata.nrw.de/produkte/transport_verkehr/unfallatlas/
- Public map portal: https://unfallatlas.statistikportal.de/
- Documentation PDF: https://www.opengeodata.nrw.de/produkte/transport_verkehr/unfallatlas/DSB_Unfallatlas.pdf
- Format used: ZIP archives containing CSV/TXT files.
- Database target: `accidents`.
- Reproducibility method: yearly ZIP files are discovered from the official OpenGeodata NRW index, downloaded unchanged, checksumed with SHA-256, and extracted.

### GV-ISys

- Role: official administrative region reference.
- Source: https://www.destatis.de/DE/Themen/Laender-Regionen/Regionales/Gemeindeverzeichnis/_inhalt.html
- File used: newest discovered `*_Auszug_GV.xlsx`
- Format used: Excel workbook.
- Database target: `regions`.
- Reproducibility method: the downloader reads the official Destatis page, selects the newest `*_Auszug_GV.xlsx`, downloads it unchanged, checksumes it, and parses it into a canonical region hierarchy.
- Fallback: if website discovery fails, the downloader uses the pinned official `31122024_Auszug_GV.xlsx` file.

### Regionalatlas / Regionalstatistik GENESIS

- Role: official regional statistical indicators for population, area, traffic accidents, vehicle stock, and passenger cars.
- Regionalatlas portal: https://regionalatlas.statistikportal.de/
- Regionalstatistik / GENESIS portal: https://www.regionalstatistik.de/genesis/online
- Format used: semicolon-separated CSV exports.
- Database target: `indicators` and `indicator_values`.
- Reproducibility method: selected official table codes are downloaded directly from Regionalstatistik/GENESIS, checksumed, parsed, and normalized.
- Dynamic note: the table codes are intentionally fixed because each code defines a required indicator. The values inside those official tables are downloaded from the source.

Current reporting periods visible in the downloaded Regionalatlas CSV headers:

| Downloaded file | Reporting period in file |
| --- | --- |
| `regionalatlas_46241-01-04-4_traffic_accidents_districts.csv` | `2023` |
| `regionalatlas_46241-01-04-5_traffic_accidents_municipalities.csv` | `2023` |
| `regionalatlas_46251-02-01-4_passenger_cars_districts.csv` | `01.01.2025` |
| `regionalatlas_46251-01-03-4_vehicle_stock_districts.csv` | `01.01.2025` |
| `regionalatlas_12411-01-01-4_population_districts.csv` | includes `31.12.2024`, `31.12.2023`, and older years |
| `regionalatlas_12411-01-01-5_population_municipalities.csv` | `31.12.2024` |
| `regionalatlas_11111-01-01-4_area_districts.csv` | `31.12.2024` |
| `regionalatlas_11111-01-01-5_area_municipalities.csv` | `31.12.2024` |

This explains why some cross-source calculations can differ from a website view if the website is filtered to another reporting period. The project should always show or document the source period used for numerator and denominator.

Tables used:

| Table code | Purpose |
| --- | --- |
| `46241-01-04-4` | Traffic accidents at district/city level |
| `46241-01-04-5` | Traffic accidents at municipality level |
| `12411-01-01-4` | Population at district/city level |
| `12411-01-01-5` | Population at municipality level |
| `11111-01-01-4` | Area at district/city level |
| `11111-01-01-5` | Area at municipality level |
| `46251-01-03-4` | Vehicle stock at district/city level |
| `46251-02-01-4` | Passenger cars at district/city level |

## Reference Sources

The assignment also mentions GENESIS, Sachsen GENESIS, and GovData. In this project they are treated as official discovery/reference portals, while the analytical database is built from the reproducible core datasets above.

- Destatis GENESIS: https://www-genesis.destatis.de/datenbank/online
- Sachsen GENESIS: https://www-statistik.sachsen.de/genonline/online
- GovData search: https://www.govdata.de/suche?tags=str%C3%A4%C3%9Fenverkehrsunf%C3%A4lle
- GovData dataset page: https://www.govdata.de/suche/daten/verkehrsunfaelleb862c

## Provenance Stored

The project stores provenance in:

- `data/manifest/download_manifest.json`
- `data/metadata/*.json`
- `source_files`
- `import_runs`

Stored metadata includes source system, source URL, file path, file name, dataset year/code where available, SHA-256 checksum, and import run ID.

## Documentation vs Generated Artifacts

The Markdown files in `backend/docs` are manually written project documentation for the assignment. They explain the data sources, ETL design, schema, API, and reproducibility workflow.

Generated reproducibility artifacts are created by the code during download and ETL:

- `backend/data/manifest/download_manifest.json`
- `backend/data/metadata/*.json`
- database rows in `source_files`
- database rows in `import_runs`
