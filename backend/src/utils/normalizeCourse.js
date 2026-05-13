function normalizeCourseCode(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim().toUpperCase();
}

function normalizeCredits(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return n;
}

function getCourseSlot(courseCode) {
  const normalized = normalizeCourseCode(courseCode);
  const last = normalized[normalized.length - 1];
  if (last === "1") return "FIRST";
  if (last === "2") return "SECOND";
  return "SINGLE";
}

module.exports = {
  normalizeCourseCode,
  normalizeCredits,
  getCourseSlot
};
