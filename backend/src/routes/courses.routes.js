const express = require("express");
const { listCourses, getCourse } = require("../controllers/courses.controller");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.get("/", asyncHandler(listCourses));
router.get("/:id", asyncHandler(getCourse));

module.exports = router;
