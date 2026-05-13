const ExcelJS = require("exceljs");

function normalizeCellValue(value) {
  if (value === null || value === undefined) return null;
  if (typeof value !== "object") return value;
  if (Array.isArray(value.richText)) {
    return value.richText.map((part) => part.text || "").join("");
  }
  if ("text" in value) return value.text;
  if ("result" in value) return value.result;
  return String(value);
}

function listWorksheetNames(workbook) {
  return workbook.worksheets.map((worksheet) => worksheet.name);
}

function readWorksheet(workbook, name, filePath = "workbook") {
  const worksheet = workbook.getWorksheet(name);
  if (!worksheet) {
    const availableSheets = listWorksheetNames(workbook);
    throw new Error(
      `Missing sheet "${name}" in ${filePath}. Available sheets: ${availableSheets.join(", ") || "(none)"}`
    );
  }

  const headers = [];
  worksheet.getRow(1).eachCell((cell, colNumber) => {
    headers[colNumber] = cell.value;
  });

  const rows = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const record = {};
    headers.forEach((header, colNumber) => {
      if (!header) return;
      record[header] = normalizeCellValue(row.getCell(colNumber).value);
    });
    rows.push(record);
  });
  return rows;
}

async function loadWorkbook(filePath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  return workbook;
}

async function loadCourseWorkbookData(filePath) {
  const workbook = await loadWorkbook(filePath);
  return {
    courseRows: readWorksheet(workbook, "courses", filePath),
    generalRows: readWorksheet(workbook, "general_courses", filePath)
  };
}

async function loadRequiredCourseWorkbookData(filePath) {
  const workbook = await loadWorkbook(filePath);
  return {
    requiredRows: readWorksheet(workbook, "required_courses", filePath)
  };
}

async function loadWorkbookData(filePath, requiredFilePath = filePath) {
  const { courseRows, generalRows } = await loadCourseWorkbookData(filePath);
  const { requiredRows } = await loadRequiredCourseWorkbookData(requiredFilePath);
  return {
    courseRows,
    requiredRows,
    generalRows
  };
}

module.exports = {
  loadWorkbookData,
  loadCourseWorkbookData,
  loadRequiredCourseWorkbookData
};
