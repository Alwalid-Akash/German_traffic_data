function normalizeKey(value) {
  return String(value)
    .toLowerCase()
    .replace(/\s/g, "")
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss");
}

function cleanText(value) {
  if (value === null || value === undefined) return null;

  const text = String(value)
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return text.length > 0 ? text : null;
}

function onlyDigits(value) {
  if (value === null || value === undefined) return null;

  const digits = String(value).replace(/\D/g, "");

  return digits.length > 0 ? digits : null;
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;

  const cleaned = String(value)
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");

  const number = Number(cleaned);

  return Number.isFinite(number) ? number : null;
}

function findValue(row, possibleNames) {
  const keys = Object.keys(row);

  for (const name of possibleNames) {
    const wanted = normalizeKey(name);

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

function findRegionAgs(row) {
  const value = findValue(row, [
    "AGS",
    "Regionalcode",
    "Regionalschlüssel",
    "regionalschluessel",
    "Schlüssel",
    "schluessel",
    "Kennziffer",
    "Code",
    "Kreis",
    "Gemeinde"
  ]);

  return onlyDigits(value);
}

function findYear(row) {
  const value = findValue(row, [
    "Jahr",
    "Zeit",
    "Berichtsjahr",
    "TIME",
    "Zeitabschnitt"
  ]);

  const digits = onlyDigits(value);

  if (!digits) return null;

  const match = digits.match(/20\d{2}|19\d{2}/);

  return match ? Number(match[0]) : null;
}

function findNumericValue(row) {
  const value = findValue(row, [
    "Wert",
    "value",
    "VALUE",
    "Anzahl",
    "Messwert"
  ]);

  return toNumber(value);
}

function looksLikeTotalRow(row) {
  const text = Object.values(row)
    .map(value => cleanText(value))
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (text.includes("insgesamt")) return true;
  if (text.includes("gesamt")) return true;
  if (text.includes("total")) return true;

  return false;
}

function shouldKeepRow(row, options) {
  /*
    Some Regionalstatistik tables contain subcategories:
    - population by sex
    - vehicles by vehicle type
    - passenger cars by fuel type

    For a first clean project version, we keep total rows when possible.
    If no "insgesamt" rows exist, the transformer still accepts the row.
  */
  if (options.preferTotalRows === true) {
    return looksLikeTotalRow(row);
  }

  return true;
}

function transformRegionalAtlasRows(rows, options) {
  const values = [];
  let skipped = 0;

  for (const row of rows) {
    if (!shouldKeepRow(row, options)) {
      skipped++;
      continue;
    }

    const ags = findRegionAgs(row);
    const year = findYear(row);
    const value = findNumericValue(row);

    if (!ags || !year || value === null) {
      skipped++;
      continue;
    }

    const regionId = options.regionMap.get(ags);

    if (!regionId) {
      skipped++;
      continue;
    }

    values.push({
      indicatorCode: options.indicatorCode,
      indicatorName: options.indicatorName,
      unit: options.unit,
      sourceSystem: "Regionalatlas / Regionalstatistik GENESIS",
      regionId,
      year,
      month: 0,
      value
    });
  }

  console.log(`Regionalatlas transformed values for ${options.indicatorCode}:`, values.length);
  console.log(`Regionalatlas skipped rows for ${options.indicatorCode}:`, skipped);

  if (values.length === 0 && rows.length > 0) {
    console.log("Regionalatlas first row:");
    console.log(rows[0]);

    console.log("Regionalatlas column names:");
    console.log(Object.keys(rows[0]));
  }

  return values;
}

module.exports = {
  transformRegionalAtlasRows
};