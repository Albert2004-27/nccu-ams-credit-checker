function parseScoreStatus(score) {
  const raw = score === null || score === undefined ? "" : String(score).trim();
  if (raw === "停修") return "WITHDRAWN";
  if (raw === "成績未到或無成績" || raw === "") return "IN_PROGRESS";
  if (raw.toUpperCase() === "MANUAL") return "PASSED";

  const numeric = Number(raw);
  if (!Number.isFinite(numeric)) return "IN_PROGRESS";
  return numeric >= 60 ? "PASSED" : "FAILED";
}

function isPassed(score) {
  return parseScoreStatus(score) === "PASSED";
}

module.exports = {
  parseScoreStatus,
  isPassed
};
