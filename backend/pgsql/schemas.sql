CREATE EXTENSION IF NOT EXISTS postgis;


--REGIONS TABLE

CREATE TABLE IF NOT EXISTS regions (
    region_id         SERIAL PRIMARY KEY,          -- PRIMARY KEY (auto-indexed)
    ags               VARCHAR(12) NOT NULL UNIQUE, -- UNIQUE CONSTRAINT (auto-indexed)
    name              VARCHAR(200) NOT NULL,
    level             VARCHAR(30) NOT NULL,
    parent_region_id  INTEGER REFERENCES regions(region_id), -- FOREIGN KEY
    geometry          GEOMETRY(MULTIPOLYGON, 4326),
    population        BIGINT,
    CONSTRAINT parent_not_self CHECK (region_id != parent_region_id)
);

-- Index on foreign key column (supports self-joins and referential integrity)
CREATE INDEX IF NOT EXISTS idx_regions_parent ON regions(parent_region_id);
-- Type: FOREIGN KEY INDEX

-- Spatial index on geometry column (accelerates geospatial queries)
CREATE INDEX IF NOT EXISTS idx_regions_geometry_gist ON regions USING GIST(geometry);
-- Type: SPATIAL INDEX


-- ACCIDENTS TABLE

CREATE TABLE IF NOT EXISTS accidents (
    accident_id       SERIAL PRIMARY KEY,          -- PRIMARY KEY (auto-indexed)
    year              SMALLINT NOT NULL,
    month             SMALLINT CHECK (month BETWEEN 1 AND 12),
    hour              SMALLINT CHECK (hour BETWEEN 0 AND 23),
    weekday           SMALLINT CHECK (weekday BETWEEN 0 AND 6),
    category          VARCHAR(50),
    type              VARCHAR(100),
    light_conditions  VARCHAR(50),
    participants      INTEGER,
    longitude         NUMERIC(10,7),
    latitude          NUMERIC(10,7),
    region_id         INTEGER NOT NULL REFERENCES regions(region_id) -- FOREIGN KEY
);

-- Index on foreign key column (accelerates joins to regions table)
CREATE INDEX IF NOT EXISTS idx_accidents_region ON accidents(region_id);
-- Type: FOREIGN KEY INDEX

-- Index on frequently filtered column (query performance)
CREATE INDEX IF NOT EXISTS idx_accidents_year ON accidents(year);
-- Type: QUERY PERFORMANCE INDEX


-- PROVENANCE TABLE

CREATE TABLE IF NOT EXISTS provenance (
    provenance_id     SERIAL PRIMARY KEY,          -- PRIMARY KEY (auto-indexed)
    source_system     VARCHAR(100) NOT NULL,
    source_url        TEXT,
    extraction_date   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    import_run_id     VARCHAR(100),
    dataset_version   VARCHAR(50),
    notes             TEXT
);
-- No additional indexes needed (small lookup table).


-- INDICATORS TABLE

CREATE TABLE IF NOT EXISTS indicators (
    indicator_id      SERIAL PRIMARY KEY,          -- PRIMARY KEY (auto-indexed)
    code              VARCHAR(50) NOT NULL UNIQUE, -- UNIQUE CONSTRAINT (auto-indexed)
    name              VARCHAR(200) NOT NULL,
    unit              VARCHAR(50),
    source_system     VARCHAR(100)
);
-- No additional indexes needed (small dimension table).


-- 5. INDICATOR VALUES TABLE (FACT TABLE)

CREATE TABLE IF NOT EXISTS indicator_values (
    region_id         INTEGER NOT NULL REFERENCES regions(region_id),     -- FOREIGN KEY
    indicator_id      INTEGER NOT NULL REFERENCES indicators(indicator_id), -- FOREIGN KEY
    year              SMALLINT NOT NULL,
    value             NUMERIC(20,5),
    provenance_id     INTEGER NOT NULL REFERENCES provenance(provenance_id), -- FOREIGN KEY
    PRIMARY KEY (region_id, indicator_id, year)  -- COMPOSITE PRIMARY KEY (auto-indexed)
);

-- Index on foreign key column (supports joins to regions)
CREATE INDEX IF NOT EXISTS idx_indicator_values_region ON indicator_values(region_id);
-- Type: FOREIGN KEY INDEX

-- Index on foreign key column (supports joins to indicators)
CREATE INDEX IF NOT EXISTS idx_indicator_values_indicator ON indicator_values(indicator_id);
-- Type: FOREIGN KEY INDEX

-- Index on frequently filtered column (query performance)
CREATE INDEX IF NOT EXISTS idx_indicator_values_year ON indicator_values(year);
-- Type: QUERY PERFORMANCE INDEX