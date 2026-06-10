const XLSX = require("xlsx");

function parseGVISysExcel(filePath) {
  const workbook = XLSX.readFile(filePath);
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];

  const rows = XLSX.utils.sheet_to_json(sheet, {
    defval: null
  });

  return rows;
}

module.exports = {
  parseGVISysExcel
};