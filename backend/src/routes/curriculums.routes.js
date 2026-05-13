const express = require("express");
const {
  listCurriculums,
  getCurriculumByYear,
  getRequirementsByYear
} = require("../controllers/curriculums.controller");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.get("/", asyncHandler(listCurriculums));
router.get("/:year", asyncHandler(getCurriculumByYear));
router.get("/:year/requirements", asyncHandler(getRequirementsByYear));

module.exports = router;
