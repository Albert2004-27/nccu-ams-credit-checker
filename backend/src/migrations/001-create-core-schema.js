async function tableExists(queryInterface, tableName) {
  const tables = await queryInterface.showAllTables();
  return tables.includes(tableName);
}

async function indexExists(queryInterface, tableName, indexName) {
  if (!(await tableExists(queryInterface, tableName))) return false;
  const indexes = await queryInterface.showIndex(tableName);
  return indexes.some((index) => index.name === indexName);
}

async function createTableIfMissing(queryInterface, tableName, columns, options, transaction) {
  if (await tableExists(queryInterface, tableName)) return;
  await queryInterface.createTable(tableName, columns, { ...options, transaction });
}

async function addIndexIfMissing(queryInterface, tableName, fields, options, transaction) {
  if (options.name && await indexExists(queryInterface, tableName, options.name)) return;
  await queryInterface.addIndex(tableName, fields, { ...options, transaction });
}

function id(DataTypes) {
  return {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  };
}

function timestamps(DataTypes) {
  return {
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false }
  };
}

module.exports = {
  async up({ queryInterface, DataTypes, transaction }) {
    await createTableIfMissing(queryInterface, "users", {
      id: id(DataTypes),
      student_number: { type: DataTypes.STRING(20), allowNull: false },
      name: { type: DataTypes.STRING(100), allowNull: false },
      email: { type: DataTypes.STRING(120), allowNull: false },
      admission_year: { type: DataTypes.INTEGER, allowNull: false },
      ...timestamps(DataTypes)
    }, {}, transaction);
    await addIndexIfMissing(queryInterface, "users", ["student_number"], {
      name: "uniq_users_student_number",
      unique: true
    }, transaction);
    await addIndexIfMissing(queryInterface, "users", ["email"], {
      name: "uniq_users_email",
      unique: true
    }, transaction);

    await createTableIfMissing(queryInterface, "academic_years", {
      id: id(DataTypes),
      year_code: { type: DataTypes.INTEGER, allowNull: false },
      description: { type: DataTypes.STRING(100), allowNull: false },
      ...timestamps(DataTypes)
    }, {}, transaction);
    await addIndexIfMissing(queryInterface, "academic_years", ["year_code"], {
      name: "uniq_academic_years_year_code",
      unique: true
    }, transaction);

    await createTableIfMissing(queryInterface, "courses", {
      id: id(DataTypes),
      academic_year: { type: DataTypes.INTEGER, allowNull: false },
      semester: { type: DataTypes.STRING(10), allowNull: false },
      course_code: { type: DataTypes.STRING(20), allowNull: false },
      course_name: { type: DataTypes.STRING(255), allowNull: false },
      credits: { type: DataTypes.DECIMAL(4, 1), allowNull: false },
      department: { type: DataTypes.STRING(120), allowNull: true },
      level: { type: DataTypes.STRING(50), allowNull: true },
      category: { type: DataTypes.STRING(50), allowNull: true },
      ...timestamps(DataTypes)
    }, {}, transaction);
    await addIndexIfMissing(queryInterface, "courses", ["semester", "course_code"], {
      name: "courses_semester_course_code",
      unique: true
    }, transaction);
    await addIndexIfMissing(queryInterface, "courses", ["academic_year"], { name: "courses_academic_year" }, transaction);
    await addIndexIfMissing(queryInterface, "courses", ["course_code"], { name: "courses_course_code" }, transaction);
    await addIndexIfMissing(queryInterface, "courses", ["department"], { name: "courses_department" }, transaction);

    await createTableIfMissing(queryInterface, "general_courses", {
      id: id(DataTypes),
      academic_year: { type: DataTypes.INTEGER, allowNull: false },
      course_code: { type: DataTypes.STRING(20), allowNull: false },
      course_name: { type: DataTypes.STRING(255), allowNull: false },
      category: { type: DataTypes.STRING(80), allowNull: false },
      is_core: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      ...timestamps(DataTypes)
    }, {}, transaction);
    await addIndexIfMissing(queryInterface, "general_courses", ["academic_year", "course_code"], {
      name: "uniq_general_courses_year_course_code",
      unique: true
    }, transaction);
    await addIndexIfMissing(queryInterface, "general_courses", ["course_code"], { name: "general_courses_course_code" }, transaction);
    await addIndexIfMissing(queryInterface, "general_courses", ["academic_year"], { name: "general_courses_academic_year" }, transaction);

    await createTableIfMissing(queryInterface, "curriculums", {
      id: id(DataTypes),
      academic_year_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "academic_years", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      department: { type: DataTypes.STRING(120), allowNull: false, defaultValue: "應用數學系" },
      program_type: { type: DataTypes.STRING(30), allowNull: false, defaultValue: "MAJOR" },
      total_required_credits: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 128 },
      ...timestamps(DataTypes)
    }, {}, transaction);
    await addIndexIfMissing(queryInterface, "curriculums", ["academic_year_id", "department", "program_type"], {
      name: "curriculums_academic_year_id_department_program_type",
      unique: true
    }, transaction);

    await createTableIfMissing(queryInterface, "requirement_groups", {
      id: id(DataTypes),
      curriculum_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "curriculums", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      group_code: { type: DataTypes.STRING(50), allowNull: false },
      group_name: { type: DataTypes.STRING(120), allowNull: false },
      min_credits: { type: DataTypes.DECIMAL(5, 1), allowNull: true },
      min_courses: { type: DataTypes.INTEGER, allowNull: true },
      display_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      ...timestamps(DataTypes)
    }, {}, transaction);
    await addIndexIfMissing(queryInterface, "requirement_groups", ["curriculum_id", "group_code"], {
      name: "requirement_groups_curriculum_id_group_code",
      unique: true
    }, transaction);

    await createTableIfMissing(queryInterface, "requirement_rules", {
      id: id(DataTypes),
      requirement_group_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "requirement_groups", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
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
      display_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      ...timestamps(DataTypes)
    }, {}, transaction);
    await addIndexIfMissing(queryInterface, "requirement_rules", ["requirement_group_id"], { name: "requirement_rules_requirement_group_id" }, transaction);
    await addIndexIfMissing(queryInterface, "requirement_rules", ["rule_type"], { name: "requirement_rules_rule_type" }, transaction);
    await addIndexIfMissing(queryInterface, "requirement_rules", ["requirement_group_id", "rule_key"], {
      name: "requirement_rules_requirement_group_id_rule_key",
      unique: true
    }, transaction);

    await createTableIfMissing(queryInterface, "student_courses", {
      id: id(DataTypes),
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      course_code: { type: DataTypes.STRING(20), allowNull: false },
      course_name: { type: DataTypes.STRING(255), allowNull: false },
      credits: { type: DataTypes.DECIMAL(4, 1), allowNull: false },
      department: { type: DataTypes.STRING(120), allowNull: true },
      course_category: { type: DataTypes.STRING(50), allowNull: true },
      academic_year: { type: DataTypes.INTEGER, allowNull: false },
      semester: { type: DataTypes.STRING(5), allowNull: false },
      academic_year_semester: { type: DataTypes.STRING(10), allowNull: false },
      required_or_elective: { type: DataTypes.STRING(20), allowNull: true },
      score: { type: DataTypes.STRING(40), allowNull: true },
      remark: { type: DataTypes.STRING(255), allowNull: true },
      status: {
        type: DataTypes.ENUM("PASSED", "FAILED", "WITHDRAWN", "IN_PROGRESS"),
        allowNull: false
      },
      source: {
        type: DataTypes.ENUM("TRANSCRIPT_JSON", "MANUAL"),
        allowNull: false,
        defaultValue: "MANUAL"
      },
      recognition_type: {
        type: DataTypes.ENUM("ORIGINAL", "APPROVED_SUBSTITUTION", "MANUAL_CREDIT"),
        allowNull: false,
        defaultValue: "ORIGINAL"
      },
      approval_status: {
        type: DataTypes.ENUM("NOT_REQUIRED", "PENDING", "APPROVED", "REJECTED"),
        allowNull: false,
        defaultValue: "NOT_REQUIRED"
      },
      substitution_for_course_code: { type: DataTypes.STRING(20), allowNull: true },
      substitution_for_course_name: { type: DataTypes.STRING(255), allowNull: true },
      approval_source: { type: DataTypes.STRING(120), allowNull: true },
      approval_note: { type: DataTypes.STRING(255), allowNull: true },
      ...timestamps(DataTypes)
    }, {}, transaction);
    await addIndexIfMissing(queryInterface, "student_courses", ["user_id", "course_code", "academic_year_semester", "source"], {
      name: "uniq_student_course_source",
      unique: true
    }, transaction);
    await addIndexIfMissing(queryInterface, "student_courses", ["user_id"], { name: "student_courses_user_id" }, transaction);
    await addIndexIfMissing(queryInterface, "student_courses", ["course_code"], { name: "student_courses_course_code" }, transaction);
    await addIndexIfMissing(queryInterface, "student_courses", ["status"], { name: "student_courses_status" }, transaction);

    await createTableIfMissing(queryInterface, "transcript_imports", {
      id: id(DataTypes),
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      source_filename: { type: DataTypes.STRING(255), allowNull: true },
      student_number: { type: DataTypes.STRING(20), allowNull: true },
      student_name: { type: DataTypes.STRING(100), allowNull: true },
      course_plan_year: { type: DataTypes.STRING(10), allowNull: true },
      total_credits_reported: { type: DataTypes.DECIMAL(5, 1), allowNull: true },
      raw_json: { type: DataTypes.JSON, allowNull: false },
      ...timestamps(DataTypes)
    }, {}, transaction);
    await addIndexIfMissing(queryInterface, "transcript_imports", ["user_id"], { name: "transcript_imports_user_id" }, transaction);

    await createTableIfMissing(queryInterface, "audit_results", {
      id: id(DataTypes),
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      curriculum_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "curriculums", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      transcript_import_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "transcript_imports", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
      },
      total_credits_earned: { type: DataTypes.DECIMAL(5, 1), allowNull: false },
      total_required_credits: { type: DataTypes.DECIMAL(5, 1), allowNull: false },
      progress_percentage: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
      result_json: { type: DataTypes.JSON, allowNull: false },
      ...timestamps(DataTypes)
    }, {}, transaction);
    await addIndexIfMissing(queryInterface, "audit_results", ["user_id", "created_at"], { name: "audit_results_user_id_created_at" }, transaction);
    await addIndexIfMissing(queryInterface, "audit_results", ["curriculum_id"], { name: "audit_results_curriculum_id" }, transaction);
    await addIndexIfMissing(queryInterface, "audit_results", ["transcript_import_id"], { name: "audit_results_transcript_import_id" }, transaction);
  }
};
