const db = require("../../db/db");

async function getOrCreateIndicator(code, name, unit, sourceSystem) {
  const result = await db.query(
    `
    INSERT INTO indicators (
      code,
      name,
      unit,
      source_system
    )
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (code)
    DO UPDATE SET
      name = EXCLUDED.name,
      unit = EXCLUDED.unit,
      source_system = EXCLUDED.source_system
    RETURNING indicator_id
    `,
    [code, name, unit, sourceSystem]
  );

  return result.rows[0].indicator_id;
}

async function getIndicatorId(code) {
  const result = await db.query(
    `
    SELECT indicator_id
    FROM indicators
    WHERE code = $1
    `,
    [code]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0].indicator_id;
}

async function saveYearlyIndicator(importRunId, indicator) {
  const indicatorId = await getOrCreateIndicator(
    indicator.code,
    indicator.name,
    indicator.unit,
    indicator.sourceSystem
  );

  await db.query(
    `
    INSERT INTO indicator_values (
      region_id,
      indicator_id,
      year,
      month,
      value,
      import_run_id
    )
    SELECT
      region_id,
      $1 AS indicator_id,
      year,
      0 AS month,
      COUNT(*)::NUMERIC AS value,
      $2 AS import_run_id
    FROM accidents
    WHERE region_id IS NOT NULL
      ${indicator.whereSql}
    GROUP BY region_id, year
    ON CONFLICT (region_id, indicator_id, year, month)
    DO UPDATE SET
      value = EXCLUDED.value,
      import_run_id = EXCLUDED.import_run_id
    `,
    [indicatorId, importRunId]
  );
}

async function saveAccidentsPer100kPopulation(importRunId) {
  const indicatorId = await getOrCreateIndicator(
    "accidents_per_100k_population",
    "Accidents per 100,000 inhabitants",
    "rate",
    "Unfallatlas + GV-ISys"
  );

  await db.query(
    `
    INSERT INTO indicator_values (
      region_id,
      indicator_id,
      year,
      month,
      value,
      import_run_id
    )
    SELECT
      a.region_id,
      $1 AS indicator_id,
      a.year,
      0 AS month,
      (COUNT(*)::NUMERIC / NULLIF(r.population, 0)) * 100000 AS value,
      $2 AS import_run_id
    FROM accidents a
    JOIN regions r ON r.region_id = a.region_id
    WHERE a.region_id IS NOT NULL
      AND r.population IS NOT NULL
      AND r.population > 0
    GROUP BY a.region_id, a.year, r.population
    ON CONFLICT (region_id, indicator_id, year, month)
    DO UPDATE SET
      value = EXCLUDED.value,
      import_run_id = EXCLUDED.import_run_id
    `,
    [indicatorId, importRunId]
  );
}

async function saveAccidentsPer100kPassengerCars(importRunId) {
  const passengerCarsIndicatorId = await getIndicatorId(
    "passenger_cars_districts"
  );

  if (!passengerCarsIndicatorId) {
    console.log(
      "Skipping accidents_per_100k_passenger_cars: passenger_cars_districts indicator not found."
    );
    return;
  }

  const resultIndicatorId = await getOrCreateIndicator(
    "accidents_per_100k_passenger_cars",
    "Accidents per 100,000 registered passenger cars",
    "rate",
    "Unfallatlas + Regionalatlas"
  );

  await db.query(
    `
    INSERT INTO indicator_values (
      region_id,
      indicator_id,
      year,
      month,
      value,
      import_run_id
    )
    WITH accident_counts AS (
      SELECT
        COALESCE(district.region_id, accident_region.region_id) AS region_id,
        a.year,
        COUNT(*)::NUMERIC AS accident_count
      FROM accidents a
      JOIN regions accident_region
        ON accident_region.region_id = a.region_id
      LEFT JOIN regions district
        ON district.region_id = accident_region.parent_region_id
       AND accident_region.level = 'municipality'
       AND district.level = 'district'
      WHERE a.region_id IS NOT NULL
      GROUP BY COALESCE(district.region_id, accident_region.region_id), a.year
    )
    SELECT
      ac.region_id,
      $1 AS indicator_id,
      ac.year,
      0 AS month,
      (ac.accident_count / NULLIF(pc.value, 0)) * 100000 AS value,
      $2 AS import_run_id
    FROM accident_counts ac
    JOIN LATERAL (
      SELECT iv.value
      FROM indicator_values iv
      WHERE iv.region_id = ac.region_id
        AND iv.indicator_id = $3
        AND iv.month = 0
        AND iv.value > 0
      ORDER BY ABS(iv.year - ac.year), iv.year DESC
      LIMIT 1
    ) pc ON TRUE
    ON CONFLICT (region_id, indicator_id, year, month)
    DO UPDATE SET
      value = EXCLUDED.value,
      import_run_id = EXCLUDED.import_run_id
    `,
    [resultIndicatorId, importRunId, passengerCarsIndicatorId]
  );
}

async function buildIndicators(importRunId) {
  const yearlyIndicators = [
    {
      code: "total_accidents",
      name: "Total accidents",
      unit: "count",
      sourceSystem: "Unfallatlas",
      whereSql: ""
    },
    {
      code: "personal_injury_accidents",
      name: "Personal injury accidents",
      unit: "count",
      sourceSystem: "Unfallatlas",
      whereSql: "AND is_personal_injury = TRUE"
    },
    {
      code: "fatal_accidents",
      name: "Fatal accidents",
      unit: "count",
      sourceSystem: "Unfallatlas",
      whereSql: "AND is_fatal = TRUE"
    },
    {
      code: "pedestrian_accidents",
      name: "Pedestrian accidents",
      unit: "count",
      sourceSystem: "Unfallatlas",
      whereSql: "AND is_pedestrian = TRUE"
    },
    {
      code: "bicycle_accidents",
      name: "Bicycle accidents",
      unit: "count",
      sourceSystem: "Unfallatlas",
      whereSql: "AND is_bicycle = TRUE"
    }
  ];

  for (const indicator of yearlyIndicators) {
    await saveYearlyIndicator(importRunId, indicator);
  }

  await saveAccidentsPer100kPopulation(importRunId);

  await saveAccidentsPer100kPassengerCars(importRunId);
}

module.exports = {
  buildIndicators
};
