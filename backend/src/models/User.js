const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define("User", {
  student_number: { type: DataTypes.STRING(20), allowNull: false },
  name: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(120), allowNull: false },
  admission_year: { type: DataTypes.INTEGER, allowNull: false }
}, {
  tableName: "users",
  indexes: [
    { name: "uniq_users_student_number", unique: true, fields: ["student_number"] },
    { name: "uniq_users_email", unique: true, fields: ["email"] }
  ]
});

module.exports = User;
