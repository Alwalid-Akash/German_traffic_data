const crypto = require("crypto");

function get(row, name) {
  return row[name] !== undefined && row[name] !== "" ? row[name] : null;
}

function toInt(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function toBool(value) {
  return String(value) === "1" || String(value).toLowerCase() === "true";
}

function pad(value, length) {
  if (value === null || value === undefined) return null;
  return String(value).padStart(length, "0");
}

function makeSourceKey(filePath, rowNumber) {
  return crypto
    .createHash("sha256")
    .update(`${filePath}-${rowNumber}`)
    .digest("hex");
}

function makeRegionAgs(row) {
  const state = pad(get(row, "ULAND"), 2);
  const district = pad(get(row, "UKREIS"), 3);
  const municipality = pad(get(row, "UGEMEINDE"), 3);

  if (state && district && municipality) {
    return `${state}${district}${municipality}`;
  }

  if (state && district) {
    return `${state}${district}`;
  }

  if (state) {
    return state;
  }

  return null;
}

function transformAccidentRow(row, context) {
  const year = toInt(get(row, "UJAHR")) || context.year;
  const category = get(row, "UKATEGORIE");

  const regionAgs = makeRegionAgs(row);
  const regionId = regionAgs ? context.regionMap.get(regionAgs) : null;

  return {
    sourceAccidentKey: makeSourceKey(context.filePath, context.rowNumber),

    year,
    month: toInt(get(row, "UMONAT")),
    hour: toInt(get(row, "USTUNDE")),
    weekday: toInt(get(row, "UWOCHENTAG")),

    category,
    type: get(row, "UTYP1"),
    lightConditions: get(row, "ULICHTVERH"),

    // In Unfallatlas, category 1/2/3 usually means personal injury accident.
    isPersonalInjury: ["1", "2", "3"].includes(String(category)),
    isFatal: String(category) === "1",

    isPedestrian: toBool(get(row, "IstFuss")),
    isBicycle: toBool(get(row, "IstRad")),
    isCar: toBool(get(row, "IstPKW")),
    isMotorcycle: toBool(get(row, "IstKrad")),

    longitude: Number(get(row, "XGCSWGS84")) || null,
    latitude: Number(get(row, "YGCSWGS84")) || null,

    regionId,
    sourceFileId: context.sourceFileId,
    importRunId: context.importRunId
  };
}

module.exports = {
  transformAccidentRow
};