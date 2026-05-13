const { AcademicYear, Curriculum, RequirementGroup, RequirementRule } = require("../../models");
const { APPLIED_MATH_DEPARTMENT, MAJOR_PROGRAM_TYPE } = require("../audit/auditPolicy");

async function listCurriculums(options = {}) {
  return Curriculum.findAll({
    include: [AcademicYear],
    order: [[AcademicYear, "year_code", "ASC"]],
    transaction: options.transaction
  });
}

async function findAcademicYearOrThrow(yearCode) {
  const academicYear = await AcademicYear.findOne({
    where: { year_code: Number(yearCode) }
  });
  if (!academicYear) {
    const error = new Error("Academic year not found");
    error.status = 404;
    throw error;
  }
  return academicYear;
}

async function findAppliedMathCurriculumByYearOrThrow(yearCode, options = {}) {
  const academicYear = await findAcademicYearOrThrow(yearCode);
  const curriculum = await Curriculum.findOne({
    where: {
      academic_year_id: academicYear.id,
      department: APPLIED_MATH_DEPARTMENT,
      program_type: MAJOR_PROGRAM_TYPE
    },
    include: options.includeAcademicYear ? [AcademicYear] : [],
    transaction: options.transaction
  });

  if (!curriculum) {
    const error = new Error("Curriculum not found");
    error.status = 404;
    throw error;
  }

  return { academicYear, curriculum };
}

async function findCurriculumRequirements(curriculumId, options = {}) {
  const groups = await RequirementGroup.findAll({
    where: { curriculum_id: curriculumId },
    order: [["display_order", "ASC"]],
    transaction: options.transaction
  });
  const rules = await RequirementRule.findAll({
    where: { requirement_group_id: groups.map((group) => group.id) },
    order: [["display_order", "ASC"]],
    transaction: options.transaction
  });
  return { groups, rules };
}

module.exports = {
  listCurriculums,
  findAcademicYearOrThrow,
  findAppliedMathCurriculumByYearOrThrow,
  findCurriculumRequirements
};
