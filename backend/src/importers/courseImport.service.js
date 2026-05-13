const { sequelize } = require("../models");
const { collectYears, importCatalogTables } = require("./catalogImport.service");
const { syncCurriculumsForYears } = require("./curriculumImport.service");
const { loadWorkbookData } = require("./workbookReader");

async function importCoursesFromWorkbook(filePath, options = {}) {
  const { requiredFilePath = filePath } = options;
  const { courseRows, requiredRows, generalRows } = await loadWorkbookData(filePath, requiredFilePath);
  const years = collectYears(courseRows);

  await sequelize.transaction(async (transaction) => {
    await importCatalogTables({ years, courseRows, generalRows, transaction });
    await syncCurriculumsForYears({ years, requiredRows, transaction });
  });

  return {
    years,
    courses: courseRows.length,
    requiredRows: requiredRows.length,
    generalCourses: years.length * generalRows.length,
    generalCourseDefinitions: generalRows.length
  };
}

module.exports = {
  importCoursesFromWorkbook
};
