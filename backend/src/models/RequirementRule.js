const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const RequirementRule = sequelize.define("RequirementRule", {
  requirement_group_id: { type: DataTypes.INTEGER, allowNull: false },
  rule_type: {
    type: DataTypes.ENUM("TOTAL_CREDITS", "COURSE_REQUIRED", "ANY_OF", "CREDIT_MINIMUM"),
    allowNull: false
  },
  rule_key: { type: DataTypes.STRING(160), allowNull: false },
  course_name: { type: DataTypes.STRING(255), allowNull: true },
  course_code: { type: DataTypes.STRING(20), allowNull: true },
  min_credits: { type: DataTypes.DECIMAL(5, 1), allowNull: true },
  credit_cap: { type: DataTypes.DECIMAL(5, 1), allowNull: true },
  metadata_json: { type: DataTypes.JSON, allowNull: true },
  display_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
}, {
  tableName: "requirement_rules",
  indexes: [
    { fields: ["requirement_group_id"] },
    { fields: ["rule_type"] },
    { unique: true, fields: ["requirement_group_id", "rule_key"] }
  ]
});

module.exports = RequirementRule;
