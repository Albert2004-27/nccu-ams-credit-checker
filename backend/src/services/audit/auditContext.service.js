const {
  GeneralCourse,
  StudentCourse,
  TranscriptImport,
  User
} = require("../../models");
const {
  findAppliedMathCurriculumByYearOrThrow,
  findCurriculumRequirements
} = require("../curriculum/curriculumQuery.service");

async function loadAuditContext({ userId, academicYear }) {
  const user = await User.findByPk(userId);
  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  const { curriculum } = await findAppliedMathCurriculumByYearOrThrow(academicYear, {
    includeAcademicYear: true
  });
  const { groups, rules } = await findCurriculumRequirements(curriculum.id);
  const studentCourses = await StudentCourse.findAll({ where: { user_id: userId } });
  const generalCourses = await GeneralCourse.findAll({
    where: { academic_year: Number(academicYear) }
  });
  const transcriptImport = await TranscriptImport.findOne({
    where: { user_id: userId },
    order: [["created_at", "DESC"]]
  });

  return {
    user,
    curriculum,
    requirementGroups: groups,
    requirementRules: rules,
    studentCourses,
    generalCourses,
    transcriptImport
  };
}

module.exports = {
  loadAuditContext
};
