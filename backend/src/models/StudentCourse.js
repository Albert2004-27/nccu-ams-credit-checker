const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const StudentCourse = sequelize.define("StudentCourse", {
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  course_code: { type: DataTypes.STRING(20), allowNull: false },
  course_name: { type: DataTypes.STRING(255), allowNull: false },
  credits: { type: DataTypes.DECIMAL(4, 1), allowNull: false },
  department: { type: DataTypes.STRING(120), allowNull: true },
  course_category: { type: DataTypes.STRING(50), allowNull: true },
  academic_year: { type: DataTypes.INTEGER, allowNull: false },
  semester: { type: DataTypes.STRING(5), allowNull: false },
  academic_year_semester: { type: DataTypes.STRING(10), allowNull: false },
  required_or_elective: { type: DataTypes.STRING(20), allowNull: true },
  score: { type: DataTypes.STRING(40), allowNull: true },
  remark: { type: DataTypes.STRING(255), allowNull: true },
  status: {
    type: DataTypes.ENUM("PASSED", "FAILED", "WITHDRAWN", "IN_PROGRESS"),
    allowNull: false
  },
  source: {
    type: DataTypes.ENUM("TRANSCRIPT_JSON", "MANUAL"),
    allowNull: false,
    defaultValue: "MANUAL"
  },
  recognition_type: {
    type: DataTypes.ENUM("ORIGINAL", "APPROVED_SUBSTITUTION", "MANUAL_CREDIT"),
    allowNull: false,
    defaultValue: "ORIGINAL"
  },
  approval_status: {
    type: DataTypes.ENUM("NOT_REQUIRED", "PENDING", "APPROVED", "REJECTED"),
    allowNull: false,
    defaultValue: "NOT_REQUIRED"
  },
  substitution_for_course_code: { type: DataTypes.STRING(20), allowNull: true },
  substitution_for_course_name: { type: DataTypes.STRING(255), allowNull: true },
  approval_source: { type: DataTypes.STRING(120), allowNull: true },
  approval_note: { type: DataTypes.STRING(255), allowNull: true }
}, {
  tableName: "student_courses",
  indexes: [
    {
      name: "uniq_student_course_source",
      unique: true,
      fields: ["user_id", "course_code", "academic_year_semester", "source"]
    },
    { fields: ["user_id"] },
    { fields: ["course_code"] },
    { fields: ["status"] }
  ]
});

module.exports = StudentCourse;
