const db = require("../../db/db");

async function getIndicatorId(code) {
  const result = await db.query(
    "SELECT indicator_id FROM indicators WHERE code = $1",
    [code]
  );

  return result.rows[0].indicator_id;
}

async function saveYearlyIndicator(importRunId, indicatorCode, whereSql) {
  const indicatorId = await getIndicatorId(indicatorCode);

  await db.query(
    `
    INSERT INTO indicator_values (region_id, indicator_id, year, month, value, import_run_id)
    SELECT
      region_id,
      $1 AS indicator_id,
      year,
      NULL AS month,
      COUNT(*)::NUMERIC AS value,
      $2 AS import_run_id
    FROM accidents
    WHERE region_id IS NOT NULL
      ${whereSql}
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
  const indicatorId = await getIndicatorId("accidents_per_100k_population");

  await db.query(
    `
    INSERT INTO indicator_values (region_id, indicator_id, year, month, value, import_run_id)
    SELECT
      a.region_id,
      $1 AS indicator_id,
      a.year,
      NULL AS month,
      (COUNT(*)::NUMERIC / NULLIF(r.population, 0)) * 100000 AS value,
      $2 AS import_run_id
    FROM accidents a
    JOIN regions r ON r.region_id = a.region_id
    WHERE a.region_id IS NOT NULL
      AND r.population IS NOT NULL
    GROUP BY a.region_id, a.year, r.population
    ON CONFLICT (region_id, indicator_id, year, month)
    DO UPDATE SET
      value = EXCLUDED.value,
      import_run_id = EXCLUDED.import_run_id
    `,
    [indicatorId, importRunId]
  );
}

async function buildIndicators(importRunId) {
  await saveYearlyIndicator(importRunId, "total_accidents", "");
  await saveYearlyIndicator(importRunId, "personal_injury_accidents", "AND is_personal_injury = TRUE");
  await saveYearlyIndicator(importRunId, "fatal_accidents", "AND is_fatal = TRUE");
  await saveYearlyIndicator(importRunId, "pedestrian_accidents", "AND is_pedestrian = TRUE");
  await saveYearlyIndicator(importRunId, "bicycle_accidents", "AND is_bicycle = TRUE");

  await saveAccidentsPer100kPopulation(importRunId);
}

module.exports = {
  buildIndicators
};