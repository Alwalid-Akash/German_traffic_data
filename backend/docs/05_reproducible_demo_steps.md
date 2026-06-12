# Reproducible Demo Steps

Use this checklist in the live demonstration.

## 1. Install Dependencies

```bash
cd backend
npm install
```

## 2. Download Source Datasets

```bash
npm run download
```

This creates:

- `data/downloads`
- `data/extracted`
- `data/metadata`
- `data/manifest`

## 3. Create Database Schema

```bash
npm run init-db
```

This runs `pgsql/schemas.sql`.

## 4. Start Backend

```bash
npm run dev
```

## 5. Run ETL

Open:

```text
http://localhost:3000/etl
```

Or run ETL directly:

```bash
npm run etl
```

## 6. Demonstrate Required Questions

Answer the required questions through AccidentInfoAPI.
The answers come from `regions`, `accidents`, `indicators`, and `indicator_values`.
They are not hardcoded in the frontend.
The justification for every answer is documented in `docs/07_answer_justifications.md`.

Run:

```bash
curl "http://localhost:3000/accidentinfoapi/answers/required-summary"
```
