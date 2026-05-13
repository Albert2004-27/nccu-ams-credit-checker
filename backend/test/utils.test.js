const test = require("node:test");
const assert = require("node:assert/strict");
const { getCourseSlot, normalizeCourseCode, normalizeCredits } = require("../src/utils/normalizeCourse");
const { parseScoreStatus } = require("../src/utils/score");
const {
  buildStudentCoursePayload,
  validateStudentCoursePayload,
  buildStudentCoursePatch,
  deriveAcademicYearSemester
} = require("../src/services/studentCourses/studentCoursePayload.service");

test("normalizes course codes", () => {
  assert.equal(normalizeCourseCode(" 701002001 "), "701002001");
});

test("normalizes credits", () => {
  assert.equal(normalizeCredits("3.0"), 3);
  assert.equal(normalizeCredits("bad"), 0);
});

test("infers semester slots from course code", () => {
  assert.equal(getCourseSlot("701002001"), "FIRST");
  assert.equal(getCourseSlot("701002012"), "SECOND");
  assert.equal(getCourseSlot("701018000"), "SINGLE");
});

test("parses score status", () => {
  assert.equal(parseScoreStatus("99.00"), "PASSED");
  assert.equal(parseScoreStatus("59"), "FAILED");
  assert.equal(parseScoreStatus("停修"), "WITHDRAWN");
  assert.equal(parseScoreStatus("成績未到或無成績"), "IN_PROGRESS");
  assert.equal(parseScoreStatus("MANUAL"), "PASSED");
});

test("validates manual student course payloads before database writes", () => {
  const invalid = buildStudentCoursePayload({ userId: 1 });
  assert.equal(validateStudentCoursePayload(invalid), "courseCode is required");

  const valid = buildStudentCoursePayload({
    userId: 1,
    courseCode: " manual-001 ",
    courseName: "外文抵免",
    credits: "3.0",
    academicYear: 111,
    semester: "1",
    academicYearSemester: "1111",
    score: "MANUAL",
    remark: "外文通"
  });
  assert.equal(validateStudentCoursePayload(valid), null);
  assert.equal(valid.course_code, "MANUAL-001");
  assert.equal(valid.credits, 3);
  assert.equal(valid.status, "PASSED");
});

test("derives academicYearSemester when omitted", () => {
  const payload = buildStudentCoursePayload({
    userId: 1,
    courseCode: "manual-002",
    courseName: "人工審核課程",
    credits: "2.0",
    academicYear: 113,
    semester: "4"
  });

  assert.equal(payload.academic_year_semester, "1134");
  assert.equal(deriveAcademicYearSemester(113, "4"), "1134");
  assert.equal(validateStudentCoursePayload(payload), null);
});

test("rejects inconsistent academic year semester values", () => {
  const invalid = buildStudentCoursePayload({
    userId: 1,
    courseCode: "manual-003",
    courseName: "不一致課程",
    credits: "3.0",
    academicYear: 111,
    semester: "2",
    academicYearSemester: "1111"
  });

  assert.equal(
    validateStudentCoursePayload(invalid),
    "academicYearSemester must match academicYear + semester"
  );
});

test("rejects inconsistent academic year semester values during patch", () => {
  const patch = buildStudentCoursePatch(
    {
      semester: "2",
      academicYearSemester: "1111"
    },
    {
      academic_year: 111,
      semester: "1"
    }
  );

  assert.equal(patch._validationError, "academicYearSemester must match academicYear + semester");
});
