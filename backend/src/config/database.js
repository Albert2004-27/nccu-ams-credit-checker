const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME || "nccu_credit_checker",
  process.env.DB_USER || "root",
  process.env.DB_PASSWORD || "root",
  {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    dialect: "mysql",
    logging: process.env.DB_LOGGING === "true" ? console.log : false,
    define: {
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  }
);

module.exports = sequelize;
