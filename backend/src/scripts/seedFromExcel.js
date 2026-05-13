const path = require("path");
const { sequelize } = require("../models");
const { importCoursesFromWorkbook } = require("../importers/courseImport.service");
const { resolveDataFile } = require("../utils/paths");

async function main() {
  const filePath = process.argv[2] ? path.resolve(process.argv[2]) : resolveDataFile("courses.xlsx");
  const requiredFilePath = process.argv[3]
    ? path.resolve(process.argv[3])
    : resolveDataFile("required_courses.xlsx");
  await sequelize.authenticate();
  const result = await importCoursesFromWorkbook(filePath, { requiredFilePath });
  console.log("Seeded from Excel:", result);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
