const db = require("../../db/db");

async function upsertIndicator(indicator) {
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
    [
      indicator.indicatorCode,
      indicator.indicatorName,
      indicator.unit,
      indicator.sourceSystem
    ]
  );

  return result.rows[0].indicator_id;
}

async function insertRegionalAtlasValues(values, importRunId) {
  if (values.length === 0) {
    return;
  }

  const indicatorId = await upsertIndicator(values[0]);

  for (const item of values) {
    await db.query(
      `
      INSERT INTO indicator_values (
        region_id,
        indicator_id,
        import_run_id,
        year,
        month,
        value
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (region_id, indicator_id, year, month)
      DO UPDATE SET
        value = EXCLUDED.value,
        import_run_id = EXCLUDED.import_run_id
      `,
      [
        item.regionId,
        indicatorId,
        importRunId,
        item.year,
        item.month,
        item.value
      ]
    );
  }
}

async function updateRegionPopulationFromIndicator(indicatorCode) {
  await db.query(
    `
    UPDATE regions r
    SET population = latest_values.value::INTEGER,
        updated_at = NOW()
    FROM (
      SELECT DISTINCT ON (iv.region_id)
        iv.region_id,
        iv.value,
        iv.year
      FROM indicator_values iv
      JOIN indicators i ON i.indicator_id = iv.indicator_id
      WHERE i.code = $1
      ORDER BY iv.region_id, iv.year DESC
    ) latest_values
    WHERE r.region_id = latest_values.region_id
    `,
    [indicatorCode]
  );
}

module.exports = {
  insertRegionalAtlasValues,
  updateRegionPopulationFromIndicator
};