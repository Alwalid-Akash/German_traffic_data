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
