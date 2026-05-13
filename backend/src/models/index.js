const sequelize = require("../config/database");

const User = require("./User");
const AcademicYear = require("./AcademicYear");
const Course = require("./Course");
const GeneralCourse = require("./GeneralCourse");
const Curriculum = require("./Curriculum");
const RequirementGroup = require("./RequirementGroup");
const RequirementRule = require("./RequirementRule");
const StudentCourse = require("./StudentCourse");
const TranscriptImport = require("./TranscriptImport");
const AuditResult = require("./AuditResult");

AcademicYear.hasMany(Curriculum, { foreignKey: "academic_year_id" });
Curriculum.belongsTo(AcademicYear, { foreignKey: "academic_year_id" });

Curriculum.hasMany(RequirementGroup, { foreignKey: "curriculum_id" });
RequirementGroup.belongsTo(Curriculum, { foreignKey: "curriculum_id" });

RequirementGroup.hasMany(RequirementRule, { foreignKey: "requirement_group_id" });
RequirementRule.belongsTo(RequirementGroup, { foreignKey: "requirement_group_id" });

User.hasMany(StudentCourse, { foreignKey: "user_id" });
StudentCourse.belongsTo(User, { foreignKey: "user_id" });

User.hasMany(TranscriptImport, { foreignKey: "user_id" });
TranscriptImport.belongsTo(User, { foreignKey: "user_id" });

User.hasMany(AuditResult, { foreignKey: "user_id" });
AuditResult.belongsTo(User, { foreignKey: "user_id" });

Curriculum.hasMany(AuditResult, { foreignKey: "curriculum_id" });
AuditResult.belongsTo(Curriculum, { foreignKey: "curriculum_id" });

TranscriptImport.hasMany(AuditResult, { foreignKey: "transcript_import_id" });
AuditResult.belongsTo(TranscriptImport, { foreignKey: "transcript_import_id" });

module.exports = {
  sequelize,
  User,
  AcademicYear,
  Course,
  GeneralCourse,
  Curriculum,
  RequirementGroup,
  RequirementRule,
  StudentCourse,
  TranscriptImport,
  AuditResult
};
