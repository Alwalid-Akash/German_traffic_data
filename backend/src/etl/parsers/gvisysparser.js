const XLSX = require("xlsx");

function cleanText(value) {
  if (value === null || value === undefined) return null;

  const text = String(value)
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return text.length > 0 ? text : null;
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

function shouldSkipSheet(sheetName) {
  const name = sheetName.toLowerCase();

  return (
    name.includes("inhalt") ||
    name.includes("deckblatt") ||
    name.includes("hinweis") ||
    name.includes("erläuterung") ||
    name.includes("erlaeuterung")
  );
}

function parseGVISysSheet(sheet, sheetName) {
  const rawRows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null
  });

  /*
    GV-ISys structure:
    row 1 = title
    row 3 = main headers
    row 4 = sub headers
    row 5 = date/unit information
    row 6 = empty
    row 7+ = real data

    In JavaScript array index:
    row 7 = index 6
  */
  const dataRows = rawRows.slice(6);

  const rows = [];

  for (const raw of dataRows) {
    const satzart = cleanText(raw[0]);

    if (!satzart) {
      continue;
    }

    rows.push({
      satzart,
      textkennzeichen: cleanText(raw[1]),

      land: cleanText(raw[2]),
      rb: cleanText(raw[3]),
      kreis: cleanText(raw[4]),
      vb: cleanText(raw[5]),
      gem: cleanText(raw[6]),

      name: cleanText(raw[7]),

      areaKm2: toNumber(raw[8]),

      populationTotal: toNumber(raw[9]),
      populationMale: toNumber(raw[10]),
      populationFemale: toNumber(raw[11]),
      populationDensity: toNumber(raw[12]),

      postalCode: cleanText(raw[13]),

      longitude: toNumber(raw[14]),
      latitude: toNumber(raw[15]),

      travelRegionCode: cleanText(raw[16]),
      travelRegionName: cleanText(raw[17]),

      urbanisationCode: cleanText(raw[18]),
      urbanisationName: cleanText(raw[19]),

      __sheetName: sheetName
    });
  }

  console.log(`GV-ISys parsed real data rows from "${sheetName}": ${rows.length}`);

  if (rows.length > 0) {
    console.log("First real GV-ISys row:");
    console.log(rows[0]);
  }

  return rows;
}

function parseGVISysExcel(filePath) {
  console.log("Opening GV-ISys file:");
  console.log(filePath);

  const workbook = XLSX.readFile(filePath);

  console.log("GV-ISys workbook sheets:");
  console.log(workbook.SheetNames);

  const allRows = [];

  for (const sheetName of workbook.SheetNames) {
    if (shouldSkipSheet(sheetName)) {
      console.log(`Skipping GV-ISys sheet: ${sheetName}`);
      continue;
    }

    const sheet = workbook.Sheets[sheetName];
    const rows = parseGVISysSheet(sheet, sheetName);

    allRows.push(...rows);
  }

  console.log("Total parsed GV-ISys rows:", allRows.length);

  return allRows;
}

module.exports = {
  parseGVISysExcel
};