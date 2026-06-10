function cleanText(value) {
  if (value === null || value === undefined) return null;
  return String(value).trim();
}

function onlyDigits(value) {
  if (value === null || value === undefined) return null;
  return String(value).replace(/\D/g, "");
}

function findValue(row, possibleNames) {
  const keys = Object.keys(row);

  for (const name of possibleNames) {
    const foundKey = keys.find(key =>
      key.toLowerCase().replace(/\s/g, "") === name.toLowerCase().replace(/\s/g, "")
    );

    if (foundKey && row[foundKey] !== null && row[foundKey] !== undefined) {
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

function parentAgs(ags) {
  if (!ags) return null;

  if (ags.length >= 8) {
    return ags.slice(0, 5);
  }

  if (ags.length === 5) {
    return ags.slice(0, 2);
  }

  return null;
}

function transformGVISysRows(rows) {
  const regions = [];

  for (const row of rows) {
    const rawAgs =
      findValue(row, ["AGS", "Gemeindeschlüssel", "Amtlicher Gemeindeschlüssel", "Regionalschlüssel"]) ||
      findValue(row, ["Schlüssel"]);

    const ags = onlyDigits(rawAgs);

    const name =
      cleanText(findValue(row, ["Name", "Gemeindename", "Gemeinde", "Kreis", "Land"])) ||
      cleanText(findValue(row, ["Bezeichnung"]));

    const populationRaw = findValue(row, [
      "Bevölkerung",
      "Bevölkerung insgesamt",
      "Einwohner",
      "Einwohner insgesamt"
    ]);

    const population = populationRaw ? Number(onlyDigits(populationRaw)) : null;

    if (!ags || !name) {
      continue;
    }

    regions.push({
      ags,
      name,
      level: detectLevel(ags),
      parentAgs: parentAgs(ags),
      population: Number.isFinite(population) ? population : null
    });
  }

  return regions;
}

module.exports = {
  transformGVISysRows
};