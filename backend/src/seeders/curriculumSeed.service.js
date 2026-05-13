const { getCourseSlot, normalizeCourseCode, normalizeCredits } = require("../utils/normalizeCourse");
const {
  GENERAL_TOTAL_REQUIRED_CREDITS,
  OTHER_ELECTIVE_REQUIRED_CREDITS,
  PHYSICAL_REQUIRED_CREDITS,
  PHYSICAL_REQUIRED_COURSES,
  TOTAL_REQUIRED_CREDITS
} = require("../services/audit/auditPolicy");

const GROUP_DEFINITIONS = [
  { group_code: "TOTAL", group_name: "總畢業學分", min_credits: TOTAL_REQUIRED_CREDITS, display_order: 1 },
  { group_code: "REQUIRED", group_name: "系必修", min_credits: null, display_order: 2 },
  { group_code: "PE", group_name: "體育必修", min_credits: PHYSICAL_REQUIRED_CREDITS, min_courses: PHYSICAL_REQUIRED_COURSES, display_order: 3 },
  { group_code: "GENERAL", group_name: "通識必修", min_credits: GENERAL_TOTAL_REQUIRED_CREDITS, display_order: 4 },
  { group_code: "ELECTIVE", group_name: "其他選修", min_credits: OTHER_ELECTIVE_REQUIRED_CREDITS, display_order: 5 }
];

function slotLabel(slot) {
  if (slot === "FIRST") return "上學期";
  if (slot === "SECOND") return "下學期";
  return "單學期";
}

function isLinearAlgebra(name) {
  return name === "線性代數";
}

function isAdvancedCalculus(name) {
  return name === "高等微積分";
}

function buildRequiredRulesForYear(year, requiredRows) {
  const rowsByName = new Map();
  for (const row of requiredRows.filter((r) => Number(r.year) === Number(year))) {
    const name = String(row.course_name || "").trim();
    if (!rowsByName.has(name)) rowsByName.set(name, []);
    rowsByName.get(name).push({
      courseCode: normalizeCourseCode(row.course_code),
      courseName: name,
      credits: normalizeCredits(row.credits)
    });
  }

  const rules = [];
  let displayOrder = 1;

  for (const [courseName, rows] of rowsByName.entries()) {
    const slotMap = new Map();

    for (const row of rows) {
      const slot = rows.length === 1 ? "SINGLE" : getCourseSlot(row.courseCode);
      const key = `${courseName}:${slot}`;
      if (!slotMap.has(key)) slotMap.set(key, { slot, rows: [] });
      slotMap.get(key).rows.push(row);
    }

    for (const { slot, rows: slotRows } of slotMap.values()) {
      const acceptedCourseCodes = [...new Set(slotRows.map((r) => r.courseCode))].sort();
      const defaultCredits = Math.max(...slotRows.map((r) => r.credits));
      const ruleKey = `${courseName}-${slot}`;
      const isEquivalent = acceptedCourseCodes.length > 1;

      let minCredits = defaultCredits;
      let creditCap = null;

      if (isLinearAlgebra(courseName) && Number(year) >= 113) {
        minCredits = 3;
        creditCap = 3;
      }

      const displayName =
        slot === "SINGLE" ? courseName : `${courseName}（${slotLabel(slot)}）`;

      rules.push({
        rule_type: isEquivalent ? "ANY_OF" : "COURSE_REQUIRED",
        rule_key: ruleKey,
        course_name: displayName,
        course_code: isEquivalent ? null : acceptedCourseCodes[0],
        min_credits: minCredits,
        credit_cap: creditCap,
        metadata_json: {
          acceptedCourseCodes,
          source: "required_courses",
          equivalency: isEquivalent,
          specialPolicy:
            isLinearAlgebra(courseName) && Number(year) >= 113
              ? "113-114 linear algebra is capped at 3 credits per semester; mathematics introduction is separately required."
              : isAdvancedCalculus(courseName) && Number(year) === 111
                ? "111 advanced calculus section codes are equivalent within the same semester."
                : null
        },
        display_order: displayOrder++
      });
    }
  }

  return rules;
}

module.exports = {
  GROUP_DEFINITIONS,
  buildRequiredRulesForYear
};
