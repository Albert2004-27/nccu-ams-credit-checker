const express = require("express");
const {
  runAuditController,
  listAuditHistory,
  getAuditHistory
} = require("../controllers/audit.controller");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.post("/run", asyncHandler(runAuditController));
router.get("/history", asyncHandler(listAuditHistory));
router.get("/history/:id", asyncHandler(getAuditHistory));

module.exports = router;
