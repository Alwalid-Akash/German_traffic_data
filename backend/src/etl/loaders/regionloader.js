const db = require("../../db/db");

async function insertRegions(regions) {
  for (const region of regions) {
    await db.query(
      `
      INSERT INTO regions (
        ags,
        name,
        level,
        parent_region_id,
        geometry,
        population
      )
      VALUES ($1, $2, $3, NULL, $4, $5)
      ON CONFLICT (ags)
      DO UPDATE SET
        name = EXCLUDED.name,
        level = EXCLUDED.level,
        geometry = EXCLUDED.geometry,
        population = EXCLUDED.population,
        updated_at = NOW()
      `,
      [
        region.ags,
        region.name,
        region.level || "unknown",
        region.geometry || null,
        region.population || null
      ]
    );
  }
}

async function updateRegionParents() {
  await db.query(
    `
    UPDATE regions child
    SET parent_region_id = parent.region_id
    FROM regions parent
    WHERE child.parent_region_id IS NULL
      AND (
        (
          child.level = 'district'
          AND parent.level = 'state'
          AND parent.ags = LEFT(child.ags, 2)
        )
        OR
        (
          child.level = 'municipality'
          AND parent.level = 'district'
          AND parent.ags = LEFT(child.ags, 5)
        )
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