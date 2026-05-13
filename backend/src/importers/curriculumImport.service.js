const { Op } = require("sequelize");
const {
  AcademicYear,
  Curriculum,
  RequirementGroup,
  RequirementRule
} = require("../models");
const { GROUP_DEFINITIONS, buildRequiredRulesForYear } = require("../seeders/curriculumSeed.service");
const {
  APPLIED_MATH_DEPARTMENT,
  MAJOR_PROGRAM_TYPE,
  TOTAL_REQUIRED_CREDITS
} = require("../services/audit/auditPolicy");

async function syncCurriculumsForYears({ years, requiredRows, transaction }) {
  for (const year of years) {
    const academicYear = await AcademicYear.findOne({ where: { year_code: year }, transaction });
    const [curriculum] = await Curriculum.findOrCreate({
      where: {
        academic_year_id: academicYear.id,
        department: APPLIED_MATH_DEPARTMENT,
        program_type: MAJOR_PROGRAM_TYPE
      },
      defaults: {
        total_required_credits: TOTAL_REQUIRED_CREDITS
      },
      transaction
    });

    const groupByCode = {};
    for (const group of GROUP_DEFINITIONS) {
      const [createdGroup] = await RequirementGroup.findOrCreate({
        where: {
          curriculum_id: curriculum.id,
          group_code: group.group_code
        },
        defaults: {
          group_name: group.group_name,
          min_credits: group.min_credits ?? null,
          min_courses: group.min_courses ?? null,
          display_order: group.display_order
        },
        transaction
      });
      await createdGroup.update({
        group_name: group.group_name,
        min_credits: group.min_credits ?? null,
        min_courses: group.min_courses ?? null,
        display_order: group.display_order
      }, { transaction });
      groupByCode[group.group_code] = createdGroup;
    }

    const validGroupCodes = GROUP_DEFINITIONS.map((group) => group.group_code);
    const obsoleteGroups = await RequirementGroup.findAll({
      where: {
        curriculum_id: curriculum.id,
        group_code: { [Op.notIn]: validGroupCodes }
      },
      transaction
    });
    if (obsoleteGroups.length > 0) {
      const obsoleteGroupIds = obsoleteGroups.map((group) => group.id);
      await RequirementRule.destroy({ where: { requirement_group_id: obsoleteGroupIds }, transaction });
      await RequirementGroup.destroy({ where: { id: obsoleteGroupIds }, transaction });
    }

    const managedGroupIds = Object.values(groupByCode).map((group) => group.id);
    await RequirementRule.destroy({
      where: { requirement_group_id: managedGroupIds },
      transaction
    });

    await RequirementRule.create({
      requirement_group_id: groupByCode.TOTAL.id,
      rule_type: "TOTAL_CREDITS",
      rule_key: "TOTAL_CREDITS_128",
      course_name: null,
      course_code: null,
      min_credits: TOTAL_REQUIRED_CREDITS,
      credit_cap: null,
      metadata_json: { source: "seed constant" },
      display_order: 1
    }, { transaction });

    const requiredGroup = groupByCode.REQUIRED;
    const rules = buildRequiredRulesForYear(year, requiredRows);
    const requiredCredits = rules.reduce((sum, rule) => sum + Number(rule.min_credits || 0), 0);
    await requiredGroup.update({ min_credits: requiredCredits }, { transaction });

    for (const rule of rules) {
      await RequirementRule.create({
        requirement_group_id: requiredGroup.id,
        ...rule
      }, { transaction });
    }

    await RequirementRule.create({
      requirement_group_id: groupByCode.ELECTIVE.id,
      rule_type: "CREDIT_MINIMUM",
      rule_key: "OTHER_ELECTIVE_CREDITS",
      min_credits: groupByCode.ELECTIVE.min_credits,
      metadata_json: {
        source: "confirmed policy",
        category: "非系必修、非體育必修、非通識的其他選修",
        physicalElectiveCreditCap: 4,
        defenseElectiveCreditCap: 4
      },
      display_order: 1
    }, { transaction });

    await RequirementRule.create({
      requirement_group_id: groupByCode.GENERAL.id,
      rule_type: "CREDIT_MINIMUM",
      rule_key: "GENERAL_CREDITS",
      min_credits: groupByCode.GENERAL.min_credits,
      metadata_json: { source: "seed constant", category: "通識" },
      display_order: 1
    }, { transaction });
  }
}

module.exports = {
  syncCurriculumsForYears
};
