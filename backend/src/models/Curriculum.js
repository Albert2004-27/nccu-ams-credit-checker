const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Curriculum = sequelize.define("Curriculum", {
  academic_year_id: { type: DataTypes.INTEGER, allowNull: false },
  department: { type: DataTypes.STRING(120), allowNull: false, defaultValue: "應用數學系" },
  program_type: { type: DataTypes.STRING(30), allowNull: false, defaultValue: "MAJOR" },
  total_required_credits: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 128 }
}, {
  tableName: "curriculums",
  indexes: [
    { unique: true, fields: ["academic_year_id", "department", "program_type"] }
  ]
});

module.exports = Curriculum;
