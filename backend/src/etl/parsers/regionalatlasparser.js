const fs = require("fs-extra");

function splitCsvLine(line) {
  return line.split(";").map(value => value.trim());
}

function onlyDigits(value) {
  if (value === null || value === undefined) return null;

  const digits = String(value).replace(/\D/g, "");

  return digits.length > 0 ? digits : null;
}

function extractYear(value) {
  const text = String(value || "");
  const match = text.match(/(?:19|20)\d{2}/);

  return match ? Number(match[0]) : null;
}

function toNumber(value) {
  if (value === null || value === undefined || value === "" || value === "-") {
    return null;
  }

  const cleaned = String(value)
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");

  const number = Number(cleaned);

  return Number.isFinite(number) ? number : null;
}

function isRegionCode(value) {
  const text = String(value || "").trim();

  return text === "DG" || /^\d{2,8}$/.test(text);
}

function isDateOrYear(value) {
  return extractYear(value) !== null;
}

function findPopulationHeaderRows(lines) {
  let dateColumns = null;
  let categoryColumns = null;

  for (const line of lines) {
    const columns = splitCsvLine(line);
    const dateCount = columns.filter(isDateOrYear).length;

    if (!dateColumns && dateCount >= 1 && columns[0] === "" && columns[1] === "") {
      dateColumns = columns;
      continue;
    }

    const categoryCount = columns.filter(value =>
      value.toLowerCase() === "insgesamt"
    ).length;

    if (!categoryColumns && categoryCount >= 1 && columns[0] === "" && columns[1] === "") {
      categoryColumns = columns;
    }
  }

  return { dateColumns, categoryColumns };
}

function parsePopulationRows(lines) {
  const rows = [];
  const { dateColumns, categoryColumns } = findPopulationHeaderRows(lines);

  for (const line of lines) {
    const columns = splitCsvLine(line);

    if (!isRegionCode(columns[0]) || !columns[1]) {
      continue;
    }

    for (let index = 2; index < columns.length; index++) {
      const category = categoryColumns ? categoryColumns[index] : "Insgesamt";

      if (category && category.toLowerCase() !== "insgesamt") {
        continue;
      }

      const year = extractYear(dateColumns ? dateColumns[index] : null);
      const value = toNumber(columns[index]);

      if (!year || value === null) {
        continue;
      }

      rows.push({
        AGS: onlyDigits(columns[0]),
        Jahr: year,
        Wert: value,
        Merkmal: "Insgesamt"
      });
    }
  }

  return rows;
}

function parseDateOrYearRows(lines) {
  const rows = [];
  const metadataYear = lines
    .map(line => {
      const columns = splitCsvLine(line);
      return columns[0] && columns[0].toLowerCase().startsWith("jahr:")
        ? extractYear(columns[0])
        : null;
    })
    .find(Boolean);

  for (const line of lines) {
    const columns = splitCsvLine(line);
    const year = extractYear(columns[0]);

    if (year && isRegionCode(columns[1]) && columns[2]) {
      const value = toNumber(columns[3]);

      if (value !== null) {
        rows.push({
          AGS: onlyDigits(columns[1]),
          Jahr: year,
          Wert: value,
          Merkmal: "Insgesamt"
        });
      }

      continue;
    }

    if (!metadataYear || !isRegionCode(columns[0]) || !columns[1]) {
      continue;
    }

    const value = toNumber(columns[2]);

    if (value === null) {
      continue;
    }

    rows.push({
      AGS: onlyDigits(columns[0]),
      Jahr: metadataYear,
      Wert: value,
      Merkmal: "Insgesamt"
    });
  }

  return rows;
}

async function parseRegionalAtlasCsv(filePath) {
  const content = await fs.readFile(filePath, "utf8");
  const lines = content
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);

  if (lines[0] && lines[0].includes("12411-01-01")) {
    return parsePopulationRows(lines);
  }

  return parseDateOrYearRows(lines);
}

module.exports = {
  parseRegionalAtlasCsv
};
