-- ============================================================
-- German Traffic Accident Analytics
-- Normalized PostgreSQL Schema
-- File: sql/schemas.sql
-- ============================================================
-- This schema follows the assignment requirements:
--
-- 1. Extract provenance:
--    import_runs, source_files
--
-- 2. Normalized region model:
--    regions
--
-- 3. Normalized event model:
--    accidents
--
-- 4. Indicator model:
--    indicators, indicator_values
--
-- This schema does NOT mirror raw source files 1:1.
-- ============================================================


-- ============================================================
-- PROVENANCE TABLE: import_runs
-- ============================================================
-- One row = one ETL execution.
-- Example:
-- When you open /etl, one import run is created.
-- ============================================================

CREATE TABLE IF NOT EXISTS import_runs (
  import_run_id SERIAL PRIMARY KEY,

  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMP,

  status VARCHAR(30) NOT NULL DEFAULT 'running',
  notes TEXT
);


-- ============================================================
-- PROVENANCE TABLE: source_files
-- ============================================================
-- Stores which raw/downloaded files were used in one ETL run.
--
-- Example:
-- Unfallatlas CSV files
-- GV-ISys Excel file
-- ============================================================

CREATE TABLE IF NOT EXISTS source_files (
  source_file_id SERIAL PRIMARY KEY,

  import_run_id INTEGER REFERENCES import_runs(import_run_id),

  source_system VARCHAR(100) NOT NULL,
  source_url TEXT,

  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,

  dataset_year INTEGER,
  dataset_version TEXT,

  sha256 TEXT,
  imported_at TIMESTAMP NOT NULL DEFAULT NOW()
);


-- ============================================================
-- REGIONS TABLE
-- ============================================================
-- Stores normalized region information.
--
-- Source:
-- Mainly GV-ISys.
--
-- Levels:
-- state
-- district
-- municipality
--
-- parent_region_id creates hierarchy:
-- municipality -> district -> state
-- ============================================================

CREATE TABLE IF NOT EXISTS regions (
  region_id SERIAL PRIMARY KEY,

  ags VARCHAR(20) UNIQUE NOT NULL,
  name TEXT NOT NULL,

  level VARCHAR(30) NOT NULL CHECK (
    level IN ('state', 'district', 'municipality', 'unknown')
  ),

  parent_region_id INTEGER REFERENCES regions(region_id),

  geometry TEXT,
  population INTEGER,

  source_system VARCHAR(100) DEFAULT 'GV-ISys',

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);


-- ============================================================
-- ACCIDENTS TABLE
-- ============================================================
-- Stores normalized accident event data.
--
-- Source:
-- Unfallatlas.
--
-- One row = one accident event.
--
-- This table does not copy all raw columns.
-- It stores cleaned fields needed for analysis.
-- ============================================================

CREATE TABLE IF NOT EXISTS accidents (
  accident_id BIGSERIAL PRIMARY KEY,

  source_accident_key TEXT UNIQUE NOT NULL,

  year INTEGER NOT NULL,
  month INTEGER,
  hour INTEGER,
  weekday INTEGER,

  category VARCHAR(100),
  type VARCHAR(100),
  light_conditions VARCHAR(100),

  participants JSONB,

  is_personal_injury BOOLEAN NOT NULL DEFAULT FALSE,
  is_fatal BOOLEAN NOT NULL DEFAULT FALSE,
  is_pedestrian BOOLEAN NOT NULL DEFAULT FALSE,
  is_bicycle BOOLEAN NOT NULL DEFAULT FALSE,
  is_car BOOLEAN NOT NULL DEFAULT FALSE,
  is_motorcycle BOOLEAN NOT NULL DEFAULT FALSE,

  longitude NUMERIC,
  latitude NUMERIC,

  region_id INTEGER REFERENCES regions(region_id),

  source_file_id INTEGER REFERENCES source_files(source_file_id),
  import_run_id INTEGER REFERENCES import_runs(import_run_id),

  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);


-- ============================================================
-- INDICATORS TABLE
-- ============================================================
-- Stores indicator definitions.
--
-- Example:
-- total_accidents
-- fatal_accidents
-- pedestrian_accidents
-- accidents_per_100k_population
-- ============================================================

CREATE TABLE IF NOT EXISTS indicators (
  indicator_id SERIAL PRIMARY KEY,

  code VARCHAR(100) UNIQUE NOT NULL,
  name TEXT NOT NULL,
  unit VARCHAR(50) NOT NULL,
  source_system VARCHAR(100) NOT NULL
);


-- ============================================================
-- INDICATOR VALUES TABLE
-- ============================================================
-- Stores calculated aggregate values.
--
-- Assignment requires:
-- region_id
-- indicator_id
-- year
-- value
--
-- We also keep month because the ETL requirement mentions
-- yearly/monthly indicators.
--
-- month = 0 means yearly indicator.
-- month = 1 to 12 means monthly indicator.
-- ============================================================

CREATE TABLE IF NOT EXISTS indicator_values (
  indicator_value_id BIGSERIAL PRIMARY KEY,

  region_id INTEGER NOT NULL REFERENCES regions(region_id),
  indicator_id INTEGER NOT NULL REFERENCES indicators(indicator_id),
  import_run_id INTEGER REFERENCES import_runs(import_run_id),

  year INTEGER NOT NULL,
  month INTEGER NOT NULL DEFAULT 0,

  value NUMERIC NOT NULL,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE (region_id, indicator_id, year, month)
);


-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_regions_ags
ON regions(ags);

CREATE INDEX IF NOT EXISTS idx_regions_level
ON regions(level);

CREATE INDEX IF NOT EXISTS idx_regions_parent
ON regions(parent_region_id);

CREATE INDEX IF NOT EXISTS idx_accidents_year
ON accidents(year);

CREATE INDEX IF NOT EXISTS idx_accidents_region
ON accidents(region_id);

CREATE INDEX IF NOT EXISTS idx_accidents_year_region
ON accidents(year, region_id);

CREATE INDEX IF NOT EXISTS idx_accidents_personal_injury
ON accidents(is_personal_injury);

CREATE INDEX IF NOT EXISTS idx_accidents_fatal
ON accidents(is_fatal);

CREATE INDEX IF NOT EXISTS idx_accidents_pedestrian
ON accidents(is_pedestrian);

CREATE INDEX IF NOT EXISTS idx_accidents_bicycle
ON accidents(is_bicycle);

CREATE INDEX IF NOT EXISTS idx_indicator_values_region
ON indicator_values(region_id);

CREATE INDEX IF NOT EXISTS idx_indicator_values_indicator
ON indicator_values(indicator_id);

CREATE INDEX IF NOT EXISTS idx_indicator_values_year
ON indicator_values(year);