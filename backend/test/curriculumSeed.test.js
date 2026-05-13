const test = require("node:test");
const assert = require("node:assert/strict");
const { buildRequiredRulesForYear } = require("../src/seeders/curriculumSeed.service");

test("builds 113 linear algebra as 6 capped credits plus mathematics introduction", () => {
  const rows = [
    { year: 113, course_code: "701002001", course_name: "線性代數", credits: 3 },
    { year: 113, course_code: "701002011", course_name: "線性代數", credits: 3 },
    { year: 113, course_code: "701002002", course_name: "線性代數", credits: 3 },
    { year: 113, course_code: "701002012", course_name: "線性代數", credits: 3 },
    { year: 113, course_code: "701025001", course_name: "數學導論", credits: 2 }
  ];
  const rules = buildRequiredRulesForYear(113, rows);
  const linearRules = rules.filter((rule) => rule.rule_key.startsWith("線性代數"));

  assert.equal(linearRules.length, 2);
  assert.equal(linearRules[0].min_credits, 3);
  assert.equal(linearRules[0].credit_cap, 3);
  assert.deepEqual(linearRules[0].metadata_json.acceptedCourseCodes, ["701002001", "701002011"]);
  assert.ok(rules.some((rule) => rule.course_name === "數學導論"));
});

test("builds 111 advanced calculus equivalency by semester", () => {
  const rows = [
    { year: 111, course_code: "701003001", course_name: "高等微積分", credits: 4 },
    { year: 111, course_code: "701003011", course_name: "高等微積分", credits: 4 },
    { year: 111, course_code: "701003002", course_name: "高等微積分", credits: 4 },
    { year: 111, course_code: "701003012", course_name: "高等微積分", credits: 4 }
  ];
  const rules = buildRequiredRulesForYear(111, rows);

  assert.equal(rules.length, 2);
  assert.equal(rules[0].rule_type, "ANY_OF");
  assert.deepEqual(rules[0].metadata_json.acceptedCourseCodes, ["701003001", "701003011"]);
  assert.deepEqual(rules[1].metadata_json.acceptedCourseCodes, ["701003002", "701003012"]);
});
