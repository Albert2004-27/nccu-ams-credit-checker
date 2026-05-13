const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const GeneralCourse = sequelize.define("GeneralCourse", {
  academic_year: { type: DataTypes.INTEGER, allowNull: false },
  course_code: { type: DataTypes.STRING(20), allowNull: false },
  course_name: { type: DataTypes.STRING(255), allowNull: false },
  category: { type: DataTypes.STRING(80), allowNull: false },
  is_core: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
}, {
  tableName: "general_courses",
  indexes: [
    { name: "uniq_general_courses_year_course_code", unique: true, fields: ["academic_year", "course_code"] },
    { fields: ["course_code"] },
    { fields: ["academic_year"] }
  ]
});

module.exports = GeneralCourse;
