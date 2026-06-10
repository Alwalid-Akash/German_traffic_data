const db = require("../../db/db");

const INDICATORS = [
  {
    code: "total_accidents",
    name: "Total traffic accidents",
    unit: "count",
    source_system: "Unfallatlas"
  },
  {
    code: "personal_injury_accidents",
    name: "Accidents involving personal injury",
    unit: "count",
    source_system: "Unfallatlas"
  },
  {
    code: "fatal_accidents",
    name: "Fatal accidents",
    unit: "count",
    source_system: "Unfallatlas"
  },
  {
    code: "pedestrian_accidents",
    name: "Pedestrian accidents",
    unit: "count",
    source_system: "Unfallatlas"
  },
  {
    code: "bicycle_accidents",
    name: "Bicycle accidents",
    unit: "count",
    source_system: "Unfallatlas"
  },
  {
    code: "accidents_per_100k_population",
    name: "Traffic accidents per 100,000 inhabitants",
    unit: "rate",
    source_system: "Unfallatlas + GV-ISys"
  }
];

async function seedIndicators() {
  for (const indicator of INDICATORS) {
    await db.query(
      `
      INSERT INTO indicators (code, name, unit, source_system)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (code)
      DO UPDATE SET
        name = EXCLUDED.name,
        unit = EXCLUDED.unit,
        source_system = EXCLUDED.source_system
      `,
      [
        indicator.code,
        indicator.name,
        indicator.unit,
        indicator.source_system
      ]
    );
  }
}

module.exports = {
  seedIndicators
};