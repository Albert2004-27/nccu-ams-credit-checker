const { StudentCourse, User } = require("../models");
const {
  buildStudentCoursePatch,
  buildStudentCoursePayload,
  validateStudentCoursePayload
} = require("../services/studentCourses/studentCoursePayload.service");

async function createManualCourse(req, res) {
  const payload = buildStudentCoursePayload(req.body, { defaultScore: "MANUAL" });
  const error = validateStudentCoursePayload(payload);
  if (error) return res.status(400).json({ error });

  const user = await User.findByPk(payload.user_id);
  if (!user) return res.status(404).json({ error: "User not found" });

  const [row, created] = await StudentCourse.upsert(payload);
  res.status(created ? 201 : 200).json({
    saved: true,
    created,
    row
  });
}

async function updateManualCourse(req, res) {
  const row = await StudentCourse.findOne({
    where: {
      id: req.params.id,
      source: "MANUAL"
    }
  });
  if (!row) return res.status(404).json({ error: "Manual course not found" });

  const patch = buildStudentCoursePatch(req.body, row);
  if (patch._validationError) {
    return res.status(400).json({ error: patch._validationError });
  }
  delete patch._validationError;

  await row.update(patch);
  res.json(row);
}

async function deleteManualCourse(req, res) {
  const deleted = await StudentCourse.destroy({
    where: {
      id: req.params.id,
      source: "MANUAL"
    }
  });
  if (!deleted) return res.status(404).json({ error: "Manual course not found" });
  res.status(204).send();
}

module.exports = {
  createManualCourse,
  updateManualCourse,
  deleteManualCourse
};
