const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const AuditResult = sequelize.define("AuditResult", {
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  curriculum_id: { type: DataTypes.INTEGER, allowNull: false },
  transcript_import_id: { type: DataTypes.INTEGER, allowNull: true },
  total_credits_earned: { type: DataTypes.DECIMAL(5, 1), allowNull: false },
  total_required_credits: { type: DataTypes.DECIMAL(5, 1), allowNull: false },
  progress_percentage: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
  result_json: { type: DataTypes.JSON, allowNull: false }
}, {
  tableName: "audit_results",
  indexes: [
    { fields: ["user_id", "created_at"] },
    { fields: ["curriculum_id"] },
    { fields: ["transcript_import_id"] }
  ]
});

module.exports = AuditResult;
