const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const RequirementGroup = sequelize.define("RequirementGroup", {
  curriculum_id: { type: DataTypes.INTEGER, allowNull: false },
  group_code: { type: DataTypes.STRING(50), allowNull: false },
  group_name: { type: DataTypes.STRING(120), allowNull: false },
  min_credits: { type: DataTypes.DECIMAL(5, 1), allowNull: true },
  min_courses: { type: DataTypes.INTEGER, allowNull: true },
  display_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
}, {
  tableName: "requirement_groups",
  indexes: [
    { unique: true, fields: ["curriculum_id", "group_code"] }
  ]
});

module.exports = RequirementGroup;
