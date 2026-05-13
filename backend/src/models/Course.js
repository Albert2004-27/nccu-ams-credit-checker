const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Course = sequelize.define("Course", {
  academic_year: { type: DataTypes.INTEGER, allowNull: false },
  semester: { type: DataTypes.STRING(10), allowNull: false },
  course_code: { type: DataTypes.STRING(20), allowNull: false },
  course_name: { type: DataTypes.STRING(255), allowNull: false },
  credits: { type: DataTypes.DECIMAL(4, 1), allowNull: false },
  department: { type: DataTypes.STRING(120), allowNull: true },
  level: { type: DataTypes.STRING(50), allowNull: true },
  category: { type: DataTypes.STRING(50), allowNull: true }
}, {
  tableName: "courses",
  indexes: [
    { unique: true, fields: ["semester", "course_code"] },
    { fields: ["academic_year"] },
    { fields: ["course_code"] },
    { fields: ["department"] }
  ]
});

module.exports = Course;
