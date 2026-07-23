# 📊 ETL Data Hub – Full‑Stack Data Pipeline

A  full‑stack project that demonstrates **E**xtract, **T**ransform, **L**oad (ETL) from three public data sources into a PostgreSQL database, serves the data via a REST API, and displays it in a clean, responsive React dashboard.
---

## 🚀 Features

- **Extract** – Downloads two direct CSV files and one ZIP archive containing a CSV from the web.
- **Transform** – Parses, unpivots, and cleans the data (e.g., wide‑to‑long for population data).
- **Load** – Inserts structured data into a PostgreSQL database with unique constraints.
- **REST API** – Express server exposes endpoints for each dataset (`/api/population`, `/api/co2`, `/api/gapminder`).
- **React Frontend** – Bootstrap‑based dashboard with dataset selector, loading spinner, error handling, and responsive data table.
- **Easy to extend** – Swap datasets by editing a single ETL script and corresponding SQL schema.

---

## 🧱 Architecture
CSV/ZIP/XLXS URLs → Node.js ETL → PostgreSQL → Express REST API → React + Bootstrap Frontend


---

## 🛠️ Tech Stack

| Layer       | Technology                              |
|-------------|-----------------------------------------|
| Frontend    | React (Vite), React‑Bootstrap, Axios    |
| Backend     | Node.js, Express, `cors`, `dotenv`      |
| Database    | PostgreSQL, `pg` driver                 |
| ETL         | Node.js, `axios`, `csv-parser`, `adm-zip` |
| Styling     | Bootstrap 5                             |

---

## 📦 Prerequisites

- **Node.js** ≥ 16.x
- **PostgreSQL** ≥ 14.x
- **Git** (optional)

---


📊 ETL Data Hub – Full‑Stack Data Pipeline

# Quick Start: How to Run the Project

This document explains the shortest way to run the AccidentInfoAPI project.

## 1. Requirements

Make sure these are installed:

- Node.js
- npm
- PostgreSQL

Also make sure your backend `.env` file contains the correct PostgreSQL connection settings.

## 2. Install Dependencies

Open a terminal in the project folder.

### Backend

```bash
cd backend
npm install
```

### Frontend

```bash
cd ../frontend
npm install
```

## 3. Create Database Tables

From the backend folder:

```bash
cd backend
npm run init-db
```

This creates the normalized database schema.

## 4. Download Source Data

From the backend folder:

```bash
npm run download
```

This downloads the official source files into `backend/data`.

If you want to download everything again, use:

```bash
npm run download:force
```

## 5. Run ETL

From the backend folder:

```bash
npm run etl
```

This parses, transforms, and loads the data into PostgreSQL.

## 6. Start Backend API

From the backend folder:

```bash
npm run dev
```

Backend runs at:

```text
http://localhost:3000
```

Useful URLs:

```text
Health: http://localhost:3000/health
API health: http://localhost:3000/accidentinfoapi/health
OpenAPI JSON: http://localhost:3000/accidentinfoapi/openapi.json
Question catalog: http://localhost:3000/accidentinfoapi/question-catalog
```

## 7. Start Frontend

Open a second terminal.

```bash
cd frontend
npm run dev
```

Frontend usually runs at:

```text
http://localhost:5173
```

## 8. Normal Run Order

Use this order when starting from an empty project setup:

```text
1. cd backend
2. npm install
3. npm run init-db
4. npm run download
5. npm run etl
6. npm run dev
7. cd ../frontend
8. npm install
9. npm run dev
```

## 9. If Data Was Deleted

If `backend/data` was deleted, run again:

```bash
cd backend
npm run download
npm run etl
```

The project is designed to rebuild the database from official downloaded sources.

