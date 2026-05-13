const fs = require("fs");
const path = require("path");
const { DataTypes } = require("sequelize");
const { sequelize } = require("../models");

const MIGRATION_TABLE = "schema_migrations";
const MIGRATIONS_DIR = path.resolve(__dirname, "../migrations");

async function tableExists(queryInterface, tableName) {
  const tables = await queryInterface.showAllTables();
  return tables.includes(tableName);
}

function fieldsKey(index) {
  return index.fields.map((field) => field.attribute).sort().join(",");
}

async function removeDuplicateUniqueIndexes(queryInterface, tableName, fieldSets) {
  if (!(await tableExists(queryInterface, tableName))) return;

  const indexes = await queryInterface.showIndex(tableName);
  for (const fieldSet of fieldSets) {
    const key = [...fieldSet.fields].sort().join(",");
    const matches = indexes.filter((index) => {
      if (index.name === "PRIMARY" || index.unique !== true) return false;
      return fieldsKey(index) === key;
    });
    if (matches.length <= 1) continue;

    const preferred = matches.find((index) => index.name === fieldSet.preferredName) || matches[0];
    for (const index of matches) {
      if (index.name === preferred.name) continue;
      await queryInterface.removeIndex(tableName, index.name);
      console.log(`Dropped duplicate index ${tableName}.${index.name}.`);
    }
  }
}

async function dropLegacyStudentCourseUniqueIndex(queryInterface) {
  if (!(await tableExists(queryInterface, "student_courses"))) return;
  const indexes = await queryInterface.showIndex("student_courses");
  const legacyIndex = indexes.find((index) => {
    const fields = index.fields.map((field) => field.attribute).sort();
    return index.unique === true
      && fields.length === 3
      && fields[0] === "academic_year_semester"
      && fields[1] === "course_code"
      && fields[2] === "user_id";
  });

  if (legacyIndex) {
    await queryInterface.removeIndex("student_courses", legacyIndex.name);
    console.log(`Dropped legacy index ${legacyIndex.name}.`);
  }
}

async function cleanupDuplicateIndexes(queryInterface) {
  await removeDuplicateUniqueIndexes(queryInterface, "users", [
    { fields: ["student_number"], preferredName: "uniq_users_student_number" },
    { fields: ["email"], preferredName: "uniq_users_email" }
  ]);
  await removeDuplicateUniqueIndexes(queryInterface, "academic_years", [
    { fields: ["year_code"], preferredName: "uniq_academic_years_year_code" }
  ]);
  await removeDuplicateUniqueIndexes(queryInterface, "general_courses", [
    { fields: ["course_code"], preferredName: "uniq_general_courses_course_code" },
    { fields: ["academic_year", "course_code"], preferredName: "uniq_general_courses_year_course_code" }
  ]);
  await dropLegacyStudentCourseUniqueIndex(queryInterface);
}

async function ensureMigrationTable(queryInterface) {
  if (await tableExists(queryInterface, MIGRATION_TABLE)) return;
  await queryInterface.createTable(MIGRATION_TABLE, {
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  });
}

async function appliedMigrationNames() {
  const [rows] = await sequelize.query(`SELECT name FROM ${MIGRATION_TABLE}`);
  return new Set(rows.map((row) => row.name));
}

async function markMigrationApplied(name, transaction) {
  await sequelize.getQueryInterface().bulkInsert(MIGRATION_TABLE, [{
    name,
    created_at: new Date()
  }], { transaction });
}

function loadMigrations() {
  return fs.readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".js"))
    .sort()
    .map((file) => ({
      name: file,
      migration: require(path.join(MIGRATIONS_DIR, file))
    }));
}

async function main() {
  await sequelize.authenticate();
  const queryInterface = sequelize.getQueryInterface();
  await cleanupDuplicateIndexes(queryInterface);
  await ensureMigrationTable(queryInterface);
  const applied = await appliedMigrationNames();

  for (const { name, migration } of loadMigrations()) {
    if (applied.has(name)) {
      console.log(`Migration already applied: ${name}`);
      continue;
    }

    await sequelize.transaction(async (transaction) => {
      await migration.up({ queryInterface, DataTypes, transaction });
      await markMigrationApplied(name, transaction);
    });
    console.log(`Migration applied: ${name}`);
  }

  await cleanupDuplicateIndexes(queryInterface);
  console.log("Database migrations completed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
