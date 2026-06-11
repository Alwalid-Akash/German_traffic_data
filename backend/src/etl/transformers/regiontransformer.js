function cleanText(value) {
  if (value === null || value === undefined) return null;

  const text = String(value)
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return text.length > 0 ? text : null;
}

function normalizeKey(value) {
  return String(value)
    .toLowerCase()
    .replace(/\s/g, "")
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss");
}

function onlyDigits(value) {
  if (value === null || value === undefined) return null;

  const digits = String(value).replace(/\D/g, "");

  return digits.length > 0 ? digits : null;
}

function findValue(row, possibleNames) {
  const keys = Object.keys(row);

  for (const possibleName of possibleNames) {
    const wanted = normalizeKey(possibleName);

    const foundKey = keys.find(key => {
      const normalized = normalizeKey(key);
      return normalized === wanted || normalized.includes(wanted);
    });

    if (
      foundKey &&
      row[foundKey] !== null &&
      row[foundKey] !== undefined &&
      row[foundKey] !== ""
    ) {
      return row[foundKey];
    }
  }

  return null;
}

function detectLevel(ags) {
  if (!ags) return "unknown";

  if (ags.length === 2) return "state";
  if (ags.length === 5) return "district";
  if (ags.length >= 8) return "municipality";

  return "unknown";
}

function transformGVISysRows(rows) {
  const regions = [];
  const seen = new Set();

  for (const row of rows) {
    const rawAgs =
      findValue(row, [
        "AGS",
        "Amtlicher Gemeindeschlüssel",
        "Gemeindeschlüssel",
        "Regionalschlüssel",
        "Schlüssel",
        "Kennziffer",
        "Satzart"
      ]);

    const ags = onlyDigits(rawAgs);

    const name =
      cleanText(
        findValue(row, [
          "Name",
          "Gemeindename",
          "Gemeinde",
          "Bezeichnung",
          "Gebietsname",
          "Landkreis",
          "Kreis",
          "Land"
        ])
      );

    const rawPopulation = findValue(row, [
      "Bevölkerung",
      "Bevölkerung insgesamt",
      "Einwohner",
      "Einwohner insgesamt"
    ]);

    const populationDigits = onlyDigits(rawPopulation);
    const population = populationDigits ? Number(populationDigits) : null;

    if (!ags || !name) {
      continue;
    }

    if (ags.length < 2) {
      continue;
    }

    if (seen.has(ags)) {
      continue;
    }

    seen.add(ags);

    regions.push({
      ags,
      name,
      level: detectLevel(ags),
      population: Number.isFinite(population) ? population : null
    });
  }

  return regions;
}

module.exports = {
  transformGVISysRows
};