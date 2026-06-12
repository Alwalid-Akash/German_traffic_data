const crypto = require("crypto");

function get(row, name) {
  return row[name] !== undefined && row[name] !== "" ? row[name] : null;
}

function toInt(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(String(value).replace(",", "."));
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

function makeRegionAgsCandidates(row) {
  const state = pad(get(row, "ULAND"), 2);
  const rb = pad(get(row, "UREGBEZ"), 1);
  const district = pad(get(row, "UKREIS"), 2);
  const municipality = pad(get(row, "UGEMEINDE"), 3);
  const candidates = [];

  if (state && rb && district && municipality) {
    candidates.push(`${state}${rb}${district}${municipality}`);
  }

  if (state && rb && district) {
    candidates.push(`${state}${rb}${district}`);
  }

  if (state) {
    candidates.push(state);
  }

  return candidates;
}

function findRegionId(row, regionMap) {
  for (const ags of makeRegionAgsCandidates(row)) {
    const regionId = regionMap.get(ags);

    if (regionId) {
      return regionId;
    }
  }

  return null;
}

function transformAccidentRow(row, context) {
  const year = toInt(get(row, "UJAHR")) || context.year;
  const category = get(row, "UKATEGORIE");

  const regionId = findRegionId(row, context.regionMap);

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

    longitude: toNumber(get(row, "XGCSWGS84")),
    latitude: toNumber(get(row, "YGCSWGS84")),

    regionId,
    sourceFileId: context.sourceFileId,
    importRunId: context.importRunId
  };
}

module.exports = {
  transformAccidentRow
};
