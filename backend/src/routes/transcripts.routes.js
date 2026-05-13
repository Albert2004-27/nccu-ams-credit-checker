const express = require("express");
const { importTranscriptController } = require("../controllers/transcripts.controller");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.post("/import", asyncHandler(importTranscriptController));

module.exports = router;
