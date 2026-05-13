const express = require("express");
const {
  createManualCourse,
  updateManualCourse,
  deleteManualCourse
} = require("../controllers/adminManualCourses.controller");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.post("/manual-courses", asyncHandler(createManualCourse));
router.patch("/manual-courses/:id", asyncHandler(updateManualCourse));
router.delete("/manual-courses/:id", asyncHandler(deleteManualCourse));

module.exports = router;
