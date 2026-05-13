const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const AcademicYear = sequelize.define("AcademicYear", {
  year_code: { type: DataTypes.INTEGER, allowNull: false },
  description: { type: DataTypes.STRING(100), allowNull: false }
}, {
  tableName: "academic_years",
  indexes: [
    { name: "uniq_academic_years_year_code", unique: true, fields: ["year_code"] }
  ]
});

module.exports = AcademicYear;
