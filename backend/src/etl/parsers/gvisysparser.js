const XLSX = require("xlsx");

function cleanText(value) {
  if (value === null || value === undefined) return "";

  return String(value)
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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

function makeUniqueHeaders(headers) {
  const result = [];
  const used = {};

  for (let i = 0; i < headers.length; i++) {
    let header = cleanText(headers[i]);

    if (!header) {
      header = `column_${i}`;
    }

    if (used[header] === undefined) {
      used[header] = 1;
      result.push(header);
    } else {
      used[header]++;
      result.push(`${header}_${used[header]}`);
    }
  }

  return result;
}

function findBestHeaderRow(rawRows) {
  for (let i = 0; i < rawRows.length; i++) {
    const rowText = rawRows[i]
      .map(cleanText)
      .join(" ")
      .toLowerCase();

    if (
      rowText.includes("land") &&
      rowText.includes("kreis") &&
      rowText.includes("gemeinde")
    ) {
      return i;
    }

    if (
      rowText.includes("gemeindename") ||
      rowText.includes("bezeichnung")
    ) {
      return i;
    }
  }

  return -1;
}

function parseSheet(sheet, sheetName) {
  const rawRows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null
  });

  console.log(`Checking sheet "${sheetName}"`);
  console.log(`Raw rows: ${rawRows.length}`);

  const headerIndex = findBestHeaderRow(rawRows);

  if (headerIndex === -1) {
    console.log(`No useful header found in sheet "${sheetName}"`);
    return [];
  }

  console.log(`Header row found in sheet "${sheetName}" at row ${headerIndex + 1}`);

  const headers = makeUniqueHeaders(rawRows[headerIndex]);
  const dataRows = rawRows.slice(headerIndex + 1);

  console.log("Detected headers:");
  console.log(headers);

  const rows = [];

  for (const rawRow of dataRows) {
    const hasContent = rawRow.some(value => cleanText(value).length > 0);

    if (!hasContent) {
      continue;
    }

    const row = {};

    for (let i = 0; i < headers.length; i++) {
      row[headers[i]] = rawRow[i];
    }

    row.__sheetName = sheetName;
    rows.push(row);
  }

  console.log(`Parsed rows from "${sheetName}": ${rows.length}`);

  if (rows.length > 0) {
    console.log("First parsed data row:");
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
      console.log(`Skipping sheet: ${sheetName}`);
      continue;
    }

    const sheet = workbook.Sheets[sheetName];
    const rows = parseSheet(sheet, sheetName);

    allRows.push(...rows);
  }

  console.log("Total parsed GV-ISys rows:", allRows.length);

  return allRows;
}

module.exports = {
  parseGVISysExcel
};