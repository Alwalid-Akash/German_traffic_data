const db = require("../../db/db");

async function insertRegions(regions) {
  for (const region of regions) {
    await db.query(
      `
      INSERT INTO regions (ags, name, level, population)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (ags, level)
      DO UPDATE SET
        name = EXCLUDED.name,
        population = EXCLUDED.population
      `,
      [region.ags, region.name, region.level, region.population]
    );
  }
}

async function updateRegionParents() {
  await db.query(
    `
    UPDATE regions child
    SET parent_region_id = parent.region_id
    FROM regions parent
    WHERE
      (
        (child.level = 'municipality' AND parent.level = 'district' AND LEFT(child.ags, 5) = parent.ags)
        OR
        (child.level = 'district' AND parent.level = 'state' AND LEFT(child.ags, 2) = parent.ags)
      )
    `
  );
}

async function getRegionMap() {
  const result = await db.query("SELECT region_id, ags, level FROM regions");

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