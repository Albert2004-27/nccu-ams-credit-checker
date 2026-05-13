const {
  AuditResult,
} = require("../models");
const { loadAuditContext } = require("../services/audit/auditContext.service");
const { runAudit } = require("../services/audit/auditEngine.service");

async function runAuditController(req, res) {
  const { userId, academicYear, includeInProgress = false, saveResult = true } = req.body;
  if (!userId) return res.status(400).json({ error: "userId is required" });
  if (!academicYear) return res.status(400).json({ error: "academicYear is required" });

  const {
    curriculum,
    requirementGroups,
    requirementRules,
    studentCourses,
    generalCourses,
    transcriptImport
  } = await loadAuditContext({ userId, academicYear });

  const result = runAudit({
    curriculum,
    requirementGroups,
    requirementRules,
    studentCourses,
    generalCourses,
    transcriptImport,
    options: { includeInProgress }
  });

  if (saveResult === false) {
    return res.status(200).json({
      auditId: null,
      saved: false,
      ...result
    });
  }

  const auditResult = await AuditResult.create({
    user_id: userId,
    curriculum_id: curriculum.id,
    transcript_import_id: transcriptImport ? transcriptImport.id : null,
    total_credits_earned: result.totalCredits.earned,
    total_required_credits: result.totalCredits.required,
    progress_percentage: result.progressPercentage,
    result_json: result
  });

  res.status(201).json({
    auditId: auditResult.id,
    saved: true,
    ...result
  });
}

async function listAuditHistory(req, res) {
  const userId = Number(req.query.userId);
  if (!userId) return res.status(400).json({ error: "userId is required" });
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const offset = Number(req.query.offset) || 0;
  const { count, rows } = await AuditResult.findAndCountAll({
    where: { user_id: userId },
    attributes: { exclude: ["result_json"] },
    order: [["created_at", "DESC"]],
    limit,
    offset
  });
  res.json({ count, rows });
}

async function getAuditHistory(req, res) {
  const row = await AuditResult.findByPk(req.params.id);
  if (!row) return res.status(404).json({ error: "Audit result not found" });
  res.json(row);
}

module.exports = {
  runAuditController,
  listAuditHistory,
  getAuditHistory
};
