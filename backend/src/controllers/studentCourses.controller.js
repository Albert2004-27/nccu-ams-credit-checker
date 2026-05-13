const { Op } = require("sequelize");
const { StudentCourse, User } = require("../models");
const {
  buildStudentCoursePayload,
  validateStudentCoursePayload
} = require("../services/studentCourses/studentCoursePayload.service");

async function listStudentCourses(req, res) {
  const userId = Number(req.query.userId);
  if (!userId) return res.status(400).json({ error: "userId is required" });

  const rows = await StudentCourse.findAll({
    where: { user_id: userId },
    order: [["academic_year_semester", "ASC"], ["course_code", "ASC"]]
  });
  res.json(rows);
}

async function listUnresolvedStudentCourses(req, res) {
  const userId = Number(req.query.userId);
  if (!userId) return res.status(400).json({ error: "userId is required" });

  const rows = await StudentCourse.findAll({
    where: {
      user_id: userId,
      [Op.or]: [
        { course_category: null },
        { course_category: "" }
      ]
    },
    order: [["academic_year_semester", "ASC"], ["course_code", "ASC"]]
  });

  res.json({
    count: rows.length,
    rows,
    note: "These transcript rows do not have course category data from data/courses.xlsx. Staff should review them before official use."
  });
}

async function createStudentCourse(req, res) {
  const payload = buildStudentCoursePayload(req.body);
  const error = validateStudentCoursePayload(payload);
  if (error) return res.status(400).json({ error });

  const user = await User.findByPk(payload.user_id);
  if (!user) return res.status(404).json({ error: "User not found" });

  const row = await StudentCourse.create(payload);
  res.status(201).json(row);
}

async function deleteStudentCourse(req, res) {
  const deleted = await StudentCourse.destroy({ where: { id: req.params.id } });
  if (!deleted) return res.status(404).json({ error: "Student course not found" });
  res.status(204).send();
}

module.exports = {
  listStudentCourses,
  listUnresolvedStudentCourses,
  createStudentCourse,
  deleteStudentCourse
};
