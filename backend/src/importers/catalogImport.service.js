const { Op } = require("sequelize");
const { AcademicYear, Course, GeneralCourse } = require("../models");
const { normalizeCourseCode, normalizeCredits } = require("../utils/normalizeCourse");

async function bulkCreateInChunks(model, rows, transaction, chunkSize = 1000) {
  for (let index = 0; index < rows.length; index += chunkSize) {
    await model.bulkCreate(rows.slice(index, index + chunkSize), { transaction });
  }
}

async function bulkUpsertInChunks(model, rows, updateOnDuplicate, transaction, chunkSize = 1000) {
  for (let index = 0; index < rows.length; index += chunkSize) {
    await model.bulkCreate(rows.slice(index, index + chunkSize), {
      updateOnDuplicate,
      transaction
    });
  }
}

function collectYears(courseRows) {
  return [...new Set(courseRows.map((row) => Number(row.year)).filter(Boolean))].sort();
}

function buildGeneralCourseRows(years, generalRows) {
  return years.flatMap((year) => generalRows.map((row) => ({
    academic_year: Number(year),
    course_code: normalizeCourseCode(row.course_code),
    course_name: String(row.course_name || "").trim(),
    category: String(row.category || "").trim(),
    is_core: Number(row.is_core) === 1
  })));
}

function buildCourseRows(courseRows) {
  return courseRows.map((row) => ({
    academic_year: Number(row.year),
    semester: String(row.semester || "").trim(),
    course_code: normalizeCourseCode(row.course_code),
    course_name: String(row.course_name || "").trim(),
    credits: normalizeCredits(row.credits),
    department: row.dept || null,
    level: row.level || null,
    category: row.category || null
  }));
}

function buildCourseRetainConditions(courseRows) {
  return courseRows.map((row) => ({
    semester: String(row.semester || "").trim(),
    course_code: normalizeCourseCode(row.course_code)
  }));
}

function buildGeneralCourseRetainConditions(generalCourseRows) {
  return generalCourseRows.map((row) => ({
    academic_year: row.academic_year,
    course_code: row.course_code
  }));
}

async function deleteMissingRows(model, { years, retainConditions, transaction }) {
  const where = { academic_year: years };
  if (retainConditions.length > 0) {
    where[Op.not] = {
      [Op.or]: retainConditions
    };
  }
  await model.destroy({ where, transaction });
}

async function importCatalogTables({ years, courseRows, generalRows, transaction }) {
  for (const year of years) {
    await AcademicYear.upsert({
      year_code: year,
      description: `${year} 學年度`
    }, { transaction });
  }

  const courseRowsToCreate = buildCourseRows(courseRows);
  await bulkUpsertInChunks(
    Course,
    courseRowsToCreate,
    ["academic_year", "course_name", "credits", "department", "level", "category"],
    transaction
  );
  await deleteMissingRows(Course, {
    years,
    retainConditions: buildCourseRetainConditions(courseRowsToCreate),
    transaction
  });

  const generalCourseRowsToCreate = buildGeneralCourseRows(years, generalRows);
  await bulkUpsertInChunks(
    GeneralCourse,
    generalCourseRowsToCreate,
    ["course_name", "category", "is_core"],
    transaction
  );
  await deleteMissingRows(GeneralCourse, {
    years,
    retainConditions: buildGeneralCourseRetainConditions(generalCourseRowsToCreate),
    transaction
  });

  return {
    generalCourseRowsToCreate
  };
}

module.exports = {
  collectYears,
  importCatalogTables
};
