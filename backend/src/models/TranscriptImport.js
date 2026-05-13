const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const TranscriptImport = sequelize.define("TranscriptImport", {
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  source_filename: { type: DataTypes.STRING(255), allowNull: true },
  student_number: { type: DataTypes.STRING(20), allowNull: true },
  student_name: { type: DataTypes.STRING(100), allowNull: true },
  course_plan_year: { type: DataTypes.STRING(10), allowNull: true },
  total_credits_reported: { type: DataTypes.DECIMAL(5, 1), allowNull: true },
  raw_json: { type: DataTypes.JSON, allowNull: false }
}, {
  tableName: "transcript_imports"
});

module.exports = TranscriptImport;
