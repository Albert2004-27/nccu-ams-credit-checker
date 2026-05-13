const {
  RequirementGroup,
  RequirementRule
} = require("../models");
const {
  listCurriculums: listCurriculumsQuery,
  findAppliedMathCurriculumByYearOrThrow
} = require("../services/curriculum/curriculumQuery.service");

async function listCurriculums(_req, res) {
  const curriculums = await listCurriculumsQuery();
  res.json(curriculums);
}

async function getCurriculumByYear(req, res) {
  const { curriculum } = await findAppliedMathCurriculumByYearOrThrow(req.params.year, {
    includeAcademicYear: true
  });
  res.json(curriculum);
}

async function getRequirementsByYear(req, res) {
  const { curriculum } = await findAppliedMathCurriculumByYearOrThrow(req.params.year, {
    includeAcademicYear: true
  });

  const groups = await RequirementGroup.findAll({
    where: { curriculum_id: curriculum.id },
    include: [RequirementRule],
    order: [["display_order", "ASC"], [RequirementRule, "display_order", "ASC"]]
  });

  res.json({
    curriculum,
    groups
  });
}

module.exports = {
  listCurriculums,
  getCurriculumByYear,
  getRequirementsByYear
};
