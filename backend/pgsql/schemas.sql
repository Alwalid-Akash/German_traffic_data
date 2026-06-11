-- ============================================================
-- German Traffic Accident Analytics
-- Normalized PostgreSQL Schema
-- ============================================================
--
-- Core datasets:
--
-- 1. Unfallatlas
--    Main accident event dataset.
--    Loaded into: accidents
--
-- 2. GV-ISys 2024
--    Official region code, name, hierarchy, population dataset.
--    Loaded into: regions
--
-- 3. Regionalatlas / Regionalstatistik GENESIS
--    Population, area, vehicle, passenger car, and statistical indicators.
--    Loaded into: indicators and indicator_values
--
-- Design decision:
-- Raw source files are NOT copied 1:1 into database tables.
-- The project separates:
-- - events: accidents
-- - regions: regions
-- - indicators: indicators, indicator_values
-- - provenance: import_runs, source_files
-- ============================================================


-- ============================================================
-- 1. IMPORT RUNS
-- ============================================================
-- One row represents one ETL execution.
-- This table stores import run ID and timestamps.
-- ============================================================

CREATE TABLE IF NOT EXISTS import_runs (
  import_run_id SERIAL PRIMARY KEY,

  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMP,

  status VARCHAR(30) NOT NULL DEFAULT 'running',

  notes TEXT
);

COMMENT ON TABLE import_runs IS
'Stores one ETL execution. Used for provenance and reproducibility.';

COMMENT ON COLUMN import_runs.import_run_id IS
'Primary key. Join key used by source_files, accidents, and indicator_values.';

COMMENT ON COLUMN import_runs.started_at IS
'Timestamp when the ETL run started.';

COMMENT ON COLUMN import_runs.finished_at IS
'Timestamp when the ETL run finished.';

COMMENT ON COLUMN import_runs.status IS
'ETL status: running, success, or failed.';


-- ============================================================
-- 2. SOURCE FILES
-- ============================================================
-- Stores metadata/provenance for downloaded raw files.
--
-- Examples:
-- Unfallatlas yearly CSV/ZIP files
-- GV-ISys Excel file
-- Regionalatlas CSV files
-- ============================================================

CREATE TABLE IF NOT EXISTS source_files (
  source_file_id SERIAL PRIMARY KEY,

  import_run_id INTEGER REFERENCES import_runs(import_run_id)
    ON DELETE SET NULL,

  source_system VARCHAR(150) NOT NULL,

  source_url TEXT,

  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,

  dataset_code VARCHAR(100),
  dataset_name TEXT,
  dataset_year INTEGER,
  dataset_version TEXT,

  sha256 TEXT,

  imported_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE source_files IS
'Stores provenance for each downloaded source file: source system, URL, file path, dataset code/year/version, checksum, and import run.';

COMMENT ON COLUMN source_files.source_file_id IS
'Primary key. Join key used by accidents and indicator_values when a row comes from a specific source file.';

COMMENT ON COLUMN source_files.import_run_id IS
'Foreign key to import_runs. Shows which ETL run used this source file.';

COMMENT ON COLUMN source_files.source_system IS
'Source system name, for example Unfallatlas, GV-ISys, or Regionalatlas.';

COMMENT ON COLUMN source_files.source_url IS
'Original URL or source reference for the downloaded file.';

COMMENT ON COLUMN source_files.dataset_code IS
'Official dataset/table code, for example 12411-01-01-4 or 46251-02-01-4.';

COMMENT ON COLUMN source_files.dataset_year IS
'Dataset year where applicable, for example Unfallatlas 2024.';

COMMENT ON COLUMN source_files.sha256 IS
'SHA-256 checksum used for reproducibility and file integrity.';


-- ============================================================
-- 3. REGIONS TABLE
-- ============================================================
-- Loaded mainly from GV-ISys.
--
-- This table normalizes states, districts, and municipalities.
-- It is the central region dimension table.
-- ============================================================

CREATE TABLE IF NOT EXISTS regions (
  region_id SERIAL PRIMARY KEY,

  ags VARCHAR(20) UNIQUE NOT NULL,

  name TEXT NOT NULL,

  level VARCHAR(30) NOT NULL CHECK (
    level IN ('state', 'district', 'municipality', 'unknown')
  ),

  parent_region_id INTEGER REFERENCES regions(region_id)
    ON DELETE SET NULL,

  geometry TEXT,

  population INTEGER,

  source_file_id INTEGER REFERENCES source_files(source_file_id)
    ON DELETE SET NULL,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE regions IS
'Stores normalized official regions from GV-ISys: states, districts, and municipalities.';

COMMENT ON COLUMN regions.region_id IS
'Primary key. Internal join key used by accidents.region_id and indicator_values.region_id.';

COMMENT ON COLUMN regions.ags IS
'Official German AGS region code. Used to match Unfallatlas, GV-ISys, and Regionalatlas data.';

COMMENT ON COLUMN regions.name IS
'Official region name from GV-ISys.';

COMMENT ON COLUMN regions.level IS
'Administrative level: state, district, municipality, or unknown.';

COMMENT ON COLUMN regions.parent_region_id IS
'Self-reference join key. Links municipality to district and district to state.';

COMMENT ON COLUMN regions.geometry IS
'Optional geometry or geometry reference. Can be NULL if geometry is not loaded.';

COMMENT ON COLUMN regions.population IS
'Population value from GV-ISys or Regionalatlas. Used for rates such as accidents per 100,000 inhabitants.';

COMMENT ON COLUMN regions.source_file_id IS
'Foreign key to source_files. Shows which GV-ISys file created or updated this region.';


-- ============================================================
-- 4. ACCIDENTS TABLE
-- ============================================================
-- Loaded from Unfallatlas.
--
-- One row = one accident event.
-- This table stores event-level data, not aggregated statistics.
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

  region_id INTEGER REFERENCES regions(region_id)
    ON DELETE SET NULL,

  source_file_id INTEGER REFERENCES source_files(source_file_id)
    ON DELETE SET NULL,

  import_run_id INTEGER REFERENCES import_runs(import_run_id)
    ON DELETE SET NULL,

  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE accidents IS
'Stores normalized Unfallatlas accident events. One row represents one accident event.';

COMMENT ON COLUMN accidents.accident_id IS
'Primary key for accident events.';

COMMENT ON COLUMN accidents.source_accident_key IS
'Generated unique key from ETL. Prevents duplicate accident loading.';

COMMENT ON COLUMN accidents.year IS
'Accident year normalized from source file year.';

COMMENT ON COLUMN accidents.month IS
'Accident month normalized from Unfallatlas data.';

COMMENT ON COLUMN accidents.hour IS
'Accident hour normalized from Unfallatlas data.';

COMMENT ON COLUMN accidents.weekday IS
'Accident weekday normalized from Unfallatlas data.';

COMMENT ON COLUMN accidents.category IS
'Normalized accident category.';

COMMENT ON COLUMN accidents.type IS
'Normalized accident type.';

COMMENT ON COLUMN accidents.light_conditions IS
'Normalized light condition value.';

COMMENT ON COLUMN accidents.participants IS
'JSONB field storing participant information.';

COMMENT ON COLUMN accidents.longitude IS
'Longitude coordinate.';

COMMENT ON COLUMN accidents.latitude IS
'Latitude coordinate.';

COMMENT ON COLUMN accidents.region_id IS
'Foreign key to regions.region_id. Connects accident events to official regions.';

COMMENT ON COLUMN accidents.source_file_id IS
'Foreign key to source_files.source_file_id. Shows which Unfallatlas file produced this accident.';

COMMENT ON COLUMN accidents.import_run_id IS
'Foreign key to import_runs.import_run_id. Shows which ETL run inserted this accident.';


-- ============================================================
-- 5. INDICATORS TABLE
-- ============================================================
-- Stores indicator definitions.
--
-- Examples:
-- total_accidents
-- fatal_accidents
-- population_districts
-- passenger_cars_districts
-- accidents_per_100k_population
-- accidents_per_100k_passenger_cars
-- ============================================================

CREATE TABLE IF NOT EXISTS indicators (
  indicator_id SERIAL PRIMARY KEY,

  code VARCHAR(150) UNIQUE NOT NULL,
  name TEXT NOT NULL,
  unit VARCHAR(50) NOT NULL,
  source_system VARCHAR(150) NOT NULL,

  description TEXT
);

COMMENT ON TABLE indicators IS
'Stores indicator definitions. Actual values are stored in indicator_values.';

COMMENT ON COLUMN indicators.indicator_id IS
'Primary key. Join key used by indicator_values.indicator_id.';

COMMENT ON COLUMN indicators.code IS
'Unique indicator code used by ETL, API, and queries.';

COMMENT ON COLUMN indicators.name IS
'Human-readable indicator name.';

COMMENT ON COLUMN indicators.unit IS
'Measurement unit, for example count, persons, km2, vehicles, cars, or rate.';

COMMENT ON COLUMN indicators.source_system IS
'Source or calculation origin, for example Unfallatlas, Regionalatlas, or Unfallatlas + Regionalatlas.';


-- ============================================================
-- 6. INDICATOR VALUES TABLE
-- ============================================================
-- Stores actual indicator values.
--
-- region_id + indicator_id + year + month identifies one value.
--
-- month = 0 means yearly value.
-- month = 1-12 means monthly value.
-- ============================================================

CREATE TABLE IF NOT EXISTS indicator_values (
  indicator_value_id BIGSERIAL PRIMARY KEY,

  region_id INTEGER NOT NULL REFERENCES regions(region_id)
    ON DELETE CASCADE,

  indicator_id INTEGER NOT NULL REFERENCES indicators(indicator_id)
    ON DELETE CASCADE,

  year INTEGER NOT NULL,

  month INTEGER NOT NULL DEFAULT 0 CHECK (month BETWEEN 0 AND 12),

  value NUMERIC NOT NULL,

  source_file_id INTEGER REFERENCES source_files(source_file_id)
    ON DELETE SET NULL,

  import_run_id INTEGER REFERENCES import_runs(import_run_id)
    ON DELETE SET NULL,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE (region_id, indicator_id, year, month)
);

COMMENT ON TABLE indicator_values IS
'Stores normalized indicator values by region, indicator, year, and month.';

COMMENT ON COLUMN indicator_values.indicator_value_id IS
'Primary key for indicator value rows.';

COMMENT ON COLUMN indicator_values.region_id IS
'Foreign key to regions.region_id. Connects an indicator value to a region.';

COMMENT ON COLUMN indicator_values.indicator_id IS
'Foreign key to indicators.indicator_id. Defines what the value means.';

COMMENT ON COLUMN indicator_values.year IS
'Reference year of the indicator value.';

COMMENT ON COLUMN indicator_values.month IS
'0 means yearly value. 1-12 means monthly value.';

COMMENT ON COLUMN indicator_values.value IS
'Numeric indicator value, for example accident count, population, area, vehicle count, or calculated rate.';

COMMENT ON COLUMN indicator_values.source_file_id IS
'Foreign key to source_files.source_file_id. Shows which Regionalatlas file produced this value where applicable.';

COMMENT ON COLUMN indicator_values.import_run_id IS
'Foreign key to import_runs.import_run_id. Shows which ETL run inserted or calculated this value.';


-- ============================================================
-- 7. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_source_files_import_run
ON source_files(import_run_id);

CREATE INDEX IF NOT EXISTS idx_source_files_source_system
ON source_files(source_system);

CREATE INDEX IF NOT EXISTS idx_regions_ags
ON regions(ags);

CREATE INDEX IF NOT EXISTS idx_regions_level
ON regions(level);

CREATE INDEX IF NOT EXISTS idx_regions_parent
ON regions(parent_region_id);

CREATE INDEX IF NOT EXISTS idx_accidents_year
ON accidents(year);

CREATE INDEX IF NOT EXISTS idx_accidents_month
ON accidents(month);

CREATE INDEX IF NOT EXISTS idx_accidents_region
ON accidents(region_id);

CREATE INDEX IF NOT EXISTS idx_accidents_year_region
ON accidents(year, region_id);

CREATE INDEX IF NOT EXISTS idx_accidents_source_file
ON accidents(source_file_id);

CREATE INDEX IF NOT EXISTS idx_accidents_import_run
ON accidents(import_run_id);

CREATE INDEX IF NOT EXISTS idx_accidents_personal_injury
ON accidents(is_personal_injury);

CREATE INDEX IF NOT EXISTS idx_accidents_fatal
ON accidents(is_fatal);

CREATE INDEX IF NOT EXISTS idx_accidents_pedestrian
ON accidents(is_pedestrian);

CREATE INDEX IF NOT EXISTS idx_accidents_bicycle
ON accidents(is_bicycle);

CREATE INDEX IF NOT EXISTS idx_indicators_code
ON indicators(code);

CREATE INDEX IF NOT EXISTS idx_indicator_values_region
ON indicator_values(region_id);

CREATE INDEX IF NOT EXISTS idx_indicator_values_indicator
ON indicator_values(indicator_id);

CREATE INDEX IF NOT EXISTS idx_indicator_values_year
ON indicator_values(year);

CREATE INDEX IF NOT EXISTS idx_indicator_values_year_month
ON indicator_values(year, month);

CREATE INDEX IF NOT EXISTS idx_indicator_values_import_run
ON indicator_values(import_run_id);

CREATE INDEX IF NOT EXISTS idx_indicator_values_source_file
ON indicator_values(source_file_id);