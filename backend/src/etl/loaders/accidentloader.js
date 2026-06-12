const db = require("../../db/db");
const { buildBulkValues, chunkArray } = require("./bulk");

async function insertAccidents(accidents) {
  const chunks = chunkArray(accidents, 500);

  for (const chunk of chunks) {
    const { params, valuesSql } = buildBulkValues(chunk, accident => [
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
    ]);

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
      VALUES ${valuesSql}
      ON CONFLICT (source_accident_key)
      DO UPDATE SET
        year = EXCLUDED.year,
        month = EXCLUDED.month,
        hour = EXCLUDED.hour,
        weekday = EXCLUDED.weekday,
        category = EXCLUDED.category,
        type = EXCLUDED.type,
        light_conditions = EXCLUDED.light_conditions,
        is_personal_injury = EXCLUDED.is_personal_injury,
        is_fatal = EXCLUDED.is_fatal,
        is_pedestrian = EXCLUDED.is_pedestrian,
        is_bicycle = EXCLUDED.is_bicycle,
        is_car = EXCLUDED.is_car,
        is_motorcycle = EXCLUDED.is_motorcycle,
        longitude = EXCLUDED.longitude,
        latitude = EXCLUDED.latitude,
        region_id = EXCLUDED.region_id,
        source_file_id = EXCLUDED.source_file_id,
        import_run_id = EXCLUDED.import_run_id
      `,
      params
    );
  }
}

module.exports = {
  insertAccidents
};
