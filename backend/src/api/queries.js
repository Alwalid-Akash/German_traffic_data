const db = require("../db/db");

function validateYear(value, name = "year") {
  const year = Number(value);
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    const error = new Error(`Invalid ${name}.`);
    error.statusCode = 400;
    throw error;
  }
  return year;
}

function validateInteger(value, name, min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER) {
  const num = Number(value);
  if (!Number.isInteger(num) || num < min || num > max) {
    const error = new Error(`Invalid ${name}.`);
    error.statusCode = 400;
    throw error;
  }
  return num;
}

function normalizeText(value) {
  return String(value || "").trim();
}

async function getCoverage() {
  const [accidents, indicators, regions, sourceFiles] = await Promise.all([
    db.query(
      `SELECT MIN(year) AS min_year, MAX(year) AS max_year, COUNT(*) AS rows FROM accidents`
    ),
    db.query(
      `SELECT ARRAY_AGG(DISTINCT code ORDER BY code) AS codes FROM indicators`
    ),
    db.query(
      `SELECT COUNT(*) AS rows, COUNT(*) FILTER (WHERE level = 'state') AS states, COUNT(*) FILTER (WHERE level = 'district') AS districts, COUNT(*) FILTER (WHERE level = 'municipality') AS municipalities FROM regions`
    ),
    db.query(
      `SELECT source_system, MAX(dataset_year) AS latest_year, COUNT(*) AS files FROM source_files GROUP BY source_system ORDER BY source_system`
    ),
  ]);

  return {
    accidents: accidents.rows[0],
    indicators: indicators.rows[0],
    regions: regions.rows[0],
    sources: sourceFiles.rows,
  };
}

async function getFilterOptions() {
  const [
    years,
    categories,
    types,
    states,
    regions,
  ] = await Promise.all([
    db.query(`SELECT DISTINCT year FROM accidents ORDER BY year`),
    db.query(
      `SELECT DISTINCT category FROM accidents WHERE category IS NOT NULL ORDER BY category`
    ),
    db.query(
      `SELECT DISTINCT type FROM accidents WHERE type IS NOT NULL ORDER BY type`
    ),
    db.query(
      `SELECT ags, name FROM regions WHERE level = 'state' ORDER BY ags`
    ),
    db.query(
      `
      SELECT ags, name, level
      FROM regions
      WHERE level IN ('state', 'district', 'municipality')
      ORDER BY level, name
      LIMIT 12000
      `
    ),
  ]);

  return {
    years: years.rows.map((row) => row.year),
    months: Array.from({ length: 12 }, (_, index) => index + 1),
    weekdays: [
      { value: 1, label: "1 - Monday" },
      { value: 2, label: "2 - Tuesday" },
      { value: 3, label: "3 - Wednesday" },
      { value: 4, label: "4 - Thursday" },
      { value: 5, label: "5 - Friday" },
      { value: 6, label: "6 - Saturday" },
      { value: 7, label: "7 - Sunday" },
    ],
    hours: Array.from({ length: 24 }, (_, index) => index),
    categories: categories.rows.map((row) => row.category),
    types: types.rows.map((row) => row.type),
    states: states.rows,
    regions: regions.rows,
  };
}

async function listRegions(query) {
  const level = normalizeText(query.level);
  const search = normalizeText(query.search);
  const stateAgs = normalizeText(query.stateAgs);

  const params = [];
  const filters = [];

  if (level) {
    params.push(level);
    filters.push(`level = $${params.length}`);
  }

  if (search) {
    params.push(`%${search}%`);
    filters.push(`name ILIKE $${params.length}`);
  }

  if (stateAgs) {
    params.push(`${stateAgs}%`);
    filters.push(`ags LIKE $${params.length}`);
  }

  const sql = `
    SELECT region_id, ags, name, level, parent_region_id, population
    FROM regions
    ${filters.length ? `WHERE ${filters.join(" AND ")}` : ""}
    ORDER BY ags
    LIMIT 500
  `;

  return db.query(sql, params);
}

async function getRegionByAgs(ags) {
  const result = await db.query(
    `SELECT region_id, ags, name, level, parent_region_id, population, geometry
     FROM regions
     WHERE ags = $1
     LIMIT 1`,
    [normalizeText(ags)]
  );

  return result.rows[0] || null;
}

async function earliestAccidentYear() {
  const result = await db.query(`SELECT MIN(year) AS earliest_accident_year FROM accidents`);
  return result.rows[0];
}

async function countAccidents(params) {
  const year = validateYear(params.year);
  const month = params.month === undefined || params.month === "" ? null : validateInteger(params.month, "month", 1, 12);
  const weekday = params.weekday === undefined || params.weekday === "" ? null : validateInteger(params.weekday, "weekday", 1, 7);
  const hour = params.hour === undefined || params.hour === "" ? null : validateInteger(params.hour, "hour", 0, 23);
  const ags = normalizeText(params.ags);
  const stateAgs = normalizeText(params.stateAgs);
  const municipality = normalizeText(params.municipality);
  const district = normalizeText(params.district);
  const category = normalizeText(params.category);
  const accidentType = normalizeText(params.type);
  const regionName = normalizeText(params.regionName);
  const personalInjury = String(params.personalInjury || "").toLowerCase() === "true";
  const pedestrian = String(params.pedestrian || "").toLowerCase() === "true";
  const bicycle = String(params.bicycle || "").toLowerCase() === "true";
  const fatal = String(params.fatal || "").toLowerCase() === "true";

  const where = ["a.year = $1"];
  const args = [year];

  if (month !== null) {
    args.push(month);
    where.push(`a.month = $${args.length}`);
  }
  if (weekday !== null) {
    args.push(weekday);
    where.push(`a.weekday = $${args.length}`);
  }
  if (hour !== null) {
    args.push(hour);
    where.push(`a.hour = $${args.length}`);
  }
  if (personalInjury) where.push("a.is_personal_injury = TRUE");
  if (pedestrian) where.push("a.is_pedestrian = TRUE");
  if (bicycle) where.push("a.is_bicycle = TRUE");
  if (String(params.car || "").toLowerCase() === "true") where.push("a.is_car = TRUE");
  if (String(params.motorcycle || "").toLowerCase() === "true") where.push("a.is_motorcycle = TRUE");
  if (fatal) where.push("a.is_fatal = TRUE");
  if (category) {
    args.push(category);
    where.push(`a.category ILIKE $${args.length}`);
  }
  if (accidentType) {
    args.push(accidentType);
    where.push(`a.type ILIKE $${args.length}`);
  }
  if (ags) {
    args.push(ags);
    where.push(`r.ags = $${args.length}`);
  }
  if (stateAgs) {
    args.push(`${stateAgs}%`);
    where.push(`LEFT(r.ags, 2) = LEFT($${args.length}, 2)`);
  }
  if (municipality) {
    args.push(`%${municipality}%`);
    where.push(`r.level = 'municipality' AND r.name ILIKE $${args.length}`);
  }
  if (district) {
    args.push(`%${district}%`);
    where.push(`(r.name ILIKE $${args.length} OR parent.name ILIKE $${args.length})`);
  }
  if (regionName) {
    args.push(`%${regionName}%`);
    where.push(`(r.name ILIKE $${args.length} OR parent.name ILIKE $${args.length})`);
  }

  const result = await db.query(
    `
    SELECT COUNT(*) AS answer
    FROM accidents a
    JOIN regions r ON r.region_id = a.region_id
    LEFT JOIN regions parent ON parent.region_id = r.parent_region_id
    WHERE ${where.join(" AND ")}
    `,
    args
  );

  return {
    answer: Number(result.rows[0].answer || 0),
    filters: {
      year,
      stateAgs: stateAgs || null,
      ags: ags || null,
      municipality: municipality || null,
      district: district || null,
      regionName: regionName || null,
      month,
      weekday,
      hour,
      category: category || null,
      type: accidentType || null,
      personalInjury,
      pedestrian,
      bicycle,
      car: String(params.car || "").toLowerCase() === "true",
      motorcycle: String(params.motorcycle || "").toLowerCase() === "true",
      fatal,
    },
  };
}

async function availableFrom(stateAgs) {
  const ags = normalizeText(stateAgs);
  const result = await db.query(
    `
    SELECT MIN(a.year) AS available_from_year
    FROM accidents a
    JOIN regions r ON r.region_id = a.region_id
    WHERE LEFT(r.ags, 2) = $1
    `,
    [ags]
  );
  return result.rows[0];
}

async function passengerCarRate({ year, limit = 10 }) {
  const accidentYear = validateYear(year);
  const maxRows = validateInteger(limit, "limit", 1, 50);

  const result = await db.query(
    `
    WITH accident_counts AS (
      SELECT
        COALESCE(district.region_id, accident_region.region_id) AS district_region_id,
        COALESCE(district.name, accident_region.name) AS district_name,
        a.year AS accident_year,
        COUNT(*)::NUMERIC AS accident_count
      FROM accidents a
      JOIN regions accident_region
        ON accident_region.region_id = a.region_id
      LEFT JOIN regions district
        ON district.region_id = accident_region.parent_region_id
       AND accident_region.level = 'municipality'
       AND district.level = 'district'
      WHERE a.year = $1
      GROUP BY COALESCE(district.region_id, accident_region.region_id), COALESCE(district.name, accident_region.name), a.year
    ),
    passenger_indicator AS (
      SELECT indicator_id
      FROM indicators
      WHERE code = 'passenger_cars_districts'
    )
    SELECT
      ac.district_name,
      ac.accident_year,
      pc.year AS passenger_car_year,
      ac.accident_count,
      pc.value AS passenger_cars,
      ROUND((ac.accident_count / NULLIF(pc.value, 0)) * 100000, 2) AS accidents_per_100k_passenger_cars
    FROM accident_counts ac
    JOIN passenger_indicator pi ON TRUE
    JOIN LATERAL (
      SELECT iv.year, iv.value
      FROM indicator_values iv
      WHERE iv.region_id = ac.district_region_id
        AND iv.indicator_id = pi.indicator_id
        AND iv.month = 0
        AND iv.value > 0
      ORDER BY ABS(iv.year - ac.accident_year), iv.year DESC
      LIMIT 1
    ) pc ON TRUE
    ORDER BY accidents_per_100k_passenger_cars DESC NULLS LAST
    LIMIT $2
    `,
    [accidentYear, maxRows]
  );

  return result.rows;
}

async function topFatalDistricts(year, limit = 5) {
  const accidentYear = validateYear(year);
  const maxRows = validateInteger(limit, "limit", 1, 20);

  const result = await db.query(
    `
    SELECT
      COALESCE(district.name, r.name) AS district_name,
      COUNT(*) AS fatal_accidents
    FROM accidents a
    JOIN regions r ON r.region_id = a.region_id
    LEFT JOIN regions district
      ON district.region_id = r.parent_region_id
     AND r.level = 'municipality'
    WHERE a.year = $1
      AND a.is_fatal = TRUE
    GROUP BY COALESCE(district.region_id, r.region_id), COALESCE(district.name, r.name)
    ORDER BY fatal_accidents DESC
    LIMIT $2
    `,
    [accidentYear, maxRows]
  );

  return result.rows;
}

async function bicycleAccidentsInDresden(year) {
  const accidentYear = validateYear(year);
  const result = await db.query(
    `
    SELECT COUNT(*) AS answer
    FROM accidents a
    JOIN regions r ON r.region_id = a.region_id
    LEFT JOIN regions parent ON parent.region_id = r.parent_region_id
    WHERE a.year = $1
      AND a.is_bicycle = TRUE
      AND (r.name ILIKE '%Dresden%' OR parent.name ILIKE '%Dresden%')
    `,
    [accidentYear]
  );

  return Number(result.rows[0].answer || 0);
}

async function zeroAccidentMunicipalities(stateAgs, year) {
  const accidentYear = validateYear(year);
  const ags = normalizeText(stateAgs);
  const result = await db.query(
    `
    SELECT municipality.ags, municipality.name
    FROM regions municipality
    JOIN regions district ON district.region_id = municipality.parent_region_id
    JOIN regions state ON state.region_id = district.parent_region_id
    LEFT JOIN accidents a
      ON a.region_id = municipality.region_id
     AND a.year = $1
    WHERE municipality.level = 'municipality'
      AND state.ags = $2
    GROUP BY municipality.region_id, municipality.ags, municipality.name
    HAVING COUNT(a.accident_id) = 0
    ORDER BY municipality.name
    `,
    [accidentYear, ags]
  );

  return result.rows;
}

module.exports = {
  getCoverage,
  getFilterOptions,
  listRegions,
  getRegionByAgs,
  earliestAccidentYear,
  countAccidents,
  availableFrom,
  passengerCarRate,
  topFatalDistricts,
  bicycleAccidentsInDresden,
  zeroAccidentMunicipalities,
  validateYear,
  validateInteger,
};
