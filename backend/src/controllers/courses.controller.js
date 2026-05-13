const { Op } = require("sequelize");
const { Course } = require("../models");

async function listCourses(req, res) {
  const {
    year,
    semester,
    department,
    category,
    keyword,
    limit = 50,
    offset = 0
  } = req.query;

  const where = {};
  if (year) where.academic_year = Number(year);
  if (semester) where.semester = semester;
  if (department) where.department = { [Op.like]: `%${department}%` };
  if (category) where.category = category;
  if (keyword) {
    where[Op.or] = [
      { course_code: { [Op.like]: `%${keyword}%` } },
      { course_name: { [Op.like]: `%${keyword}%` } }
    ];
  }

  const result = await Course.findAndCountAll({
    where,
    limit: Math.min(Number(limit) || 50, 200),
    offset: Number(offset) || 0,
    order: [["academic_year", "ASC"], ["semester", "ASC"], ["course_code", "ASC"]]
  });

  res.json({
    count: result.count,
    rows: result.rows
  });
}

async function getCourse(req, res) {
  const course = await Course.findByPk(req.params.id);
  if (!course) return res.status(404).json({ error: "Course not found" });
  res.json(course);
}

module.exports = {
  listCourses,
  getCourse
};
