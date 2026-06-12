const db = require("../../db/db");
const { buildBulkValues, chunkArray } = require("./bulk");

async function insertRegions(regions, sourceFileId = null) {
  const chunks = chunkArray(regions, 500);

  for (const chunk of chunks) {
    const { params, valuesSql } = buildBulkValues(chunk, region => [
      region.ags,
      region.name,
      region.level || "unknown",
      null,
      region.geometry || null,
      region.population || null,
      sourceFileId
    ]);

    await db.query(
      `
      INSERT INTO regions (
        ags,
        name,
        level,
        parent_region_id,
        geometry,
        population,
        source_file_id
      )
      VALUES ${valuesSql}
      ON CONFLICT (ags)
      DO UPDATE SET
        name = EXCLUDED.name,
        level = EXCLUDED.level,
        geometry = EXCLUDED.geometry,
        population = EXCLUDED.population,
        source_file_id = EXCLUDED.source_file_id,
        updated_at = NOW()
      `,
      params
    );
  }
}

async function updateRegionParents() {
  await db.query(
    `
    UPDATE regions child
    SET parent_region_id = parent.region_id
    FROM regions parent
    WHERE (
      child.level = 'district'
      AND parent.level = 'state'
      AND parent.ags = LEFT(child.ags, 2)
    )
    OR (
      child.level = 'municipality'
      AND parent.level = 'district'
      AND parent.ags = LEFT(child.ags, 5)
    )
    `
  );
}

async function getRegionMap() {
  const result = await db.query(
    `
    SELECT region_id, ags
    FROM regions
    `
  );

  const map = new Map();

  for (const row of result.rows) {
    map.set(row.ags, row.region_id);
  }

  return map;
}

module.exports = {
  insertRegions,
  updateRegionParents,
  getRegionMap
};
