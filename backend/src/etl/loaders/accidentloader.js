const db = require("../../db/db");

async function insertAccidents(accidents) {
  for (const accident of accidents) {
    await db.query(
      `
      INSERT INTO accidents (
        source_accident_key,
        year,
        month,
        hour,
        weekday,
        category,
        type,
        light_conditions,
        is_personal_injury,
        is_fatal,
        is_pedestrian,
        is_bicycle,
        is_car,
        is_motorcycle,
        longitude,
        latitude,
        region_id,
        source_file_id,
        import_run_id
      )
      VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15,
        $16, $17, $18, $19
      )
      ON CONFLICT (source_accident_key) DO NOTHING
      `,
      [
        accident.sourceAccidentKey,
        accident.year,
        accident.month,
        accident.hour,
        accident.weekday,
        accident.category,
        accident.type,
        accident.lightConditions,
        accident.isPersonalInjury,
        accident.isFatal,
        accident.isPedestrian,
        accident.isBicycle,
        accident.isCar,
        accident.isMotorcycle,
        accident.longitude,
        accident.latitude,
        accident.regionId,
        accident.sourceFileId,
        accident.importRunId
      ]
    );
  }
}

module.exports = {
  insertAccidents
};