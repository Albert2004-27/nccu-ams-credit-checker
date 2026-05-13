const { normalizeCourseCode, normalizeCredits } = require("../../utils/normalizeCourse");
const { parseScoreStatus } = require("../../utils/score");

function deriveAcademicYearSemester(academicYear, semester) {
  const normalizedAcademicYear = Number(academicYear);
  const normalizedSemester = String(semester || "").trim();

  if (!Number.isFinite(normalizedAcademicYear) || !normalizedSemester) {
    return "";
  }

  return `${normalizedAcademicYear}${normalizedSemester}`;
}

function buildStudentCoursePayload(body, options = {}) {
  const {
    source = "MANUAL",
    defaultScore = null,
    defaultRecognitionType = "MANUAL_CREDIT",
    defaultApprovalStatus = "APPROVED"
  } = options;

  const {
    userId,
    courseCode,
    courseName,
    credits,
    academicYear,
    semester,
    academicYearSemester,
    department,
    courseCategory,
    requiredOrElective,
    score = defaultScore,
    remark,
    recognitionType,
    approvalStatus,
    substitutionForCourseCode,
    substitutionForCourseName,
    approvalSource,
    approvalNote
  } = body;

  const normalizedAcademicYear = Number(academicYear);
  const normalizedSemester = String(semester || "").trim();
  const normalizedAcademicYearSemester = String(academicYearSemester || "").trim()
    || deriveAcademicYearSemester(normalizedAcademicYear, normalizedSemester);

  return {
    user_id: userId,
    course_code: normalizeCourseCode(courseCode),
    course_name: String(courseName || "").trim(),
    credits: normalizeCredits(credits),
    department: department || null,
    course_category: courseCategory || null,
    academic_year: normalizedAcademicYear,
    semester: normalizedSemester,
    academic_year_semester: normalizedAcademicYearSemester,
    required_or_elective: requiredOrElective || null,
    score: score || null,
    remark: remark || null,
    status: parseScoreStatus(score),
    source,
    recognition_type: recognitionType || defaultRecognitionType,
    approval_status: approvalStatus || defaultApprovalStatus,
    substitution_for_course_code: substitutionForCourseCode ? normalizeCourseCode(substitutionForCourseCode) : null,
    substitution_for_course_name: substitutionForCourseName || null,
    approval_source: approvalSource || null,
    approval_note: approvalNote || null
  };
}

function validateStudentCoursePayload(payload) {
  if (!payload.user_id) return "userId is required";
  if (!payload.course_code) return "courseCode is required";
  if (!payload.course_name) return "courseName is required";
  if (!payload.credits) return "credits is required";
  if (!Number.isFinite(payload.academic_year)) return "academicYear is required";
  if (!payload.semester) return "semester is required";
  if (!payload.academic_year_semester) return "academicYearSemester is required";
  if (payload.academic_year_semester !== deriveAcademicYearSemester(payload.academic_year, payload.semester)) {
    return "academicYearSemester must match academicYear + semester";
  }
  return null;
}

function buildStudentCoursePatch(body, currentRow = {}) {
  const patch = {};

  if (body.courseCode !== undefined) patch.course_code = normalizeCourseCode(body.courseCode);
  if (body.courseName !== undefined) patch.course_name = String(body.courseName || "").trim();
  if (body.credits !== undefined) patch.credits = normalizeCredits(body.credits);
  if (body.department !== undefined) patch.department = body.department || null;
  if (body.courseCategory !== undefined) patch.course_category = body.courseCategory || null;
  if (body.academicYear !== undefined) patch.academic_year = Number(body.academicYear);
  if (body.semester !== undefined) patch.semester = String(body.semester || "").trim();

  const nextAcademicYear = patch.academic_year ?? currentRow.academic_year;
  const nextSemester = patch.semester ?? currentRow.semester;

  if (
    body.academicYear !== undefined
    || body.semester !== undefined
    || body.academicYearSemester !== undefined
  ) {
    const providedAcademicYearSemester = body.academicYearSemester !== undefined
      ? String(body.academicYearSemester || "").trim()
      : null;
    const derivedAcademicYearSemester = deriveAcademicYearSemester(nextAcademicYear, nextSemester);

    if (providedAcademicYearSemester && providedAcademicYearSemester !== derivedAcademicYearSemester) {
      patch._validationError = "academicYearSemester must match academicYear + semester";
      return patch;
    }

    patch.academic_year_semester = providedAcademicYearSemester || derivedAcademicYearSemester;
  }
  if (body.requiredOrElective !== undefined) patch.required_or_elective = body.requiredOrElective || null;
  if (body.score !== undefined) {
    patch.score = body.score;
    patch.status = parseScoreStatus(body.score);
  }
  if (body.remark !== undefined) patch.remark = body.remark || null;
  if (body.recognitionType !== undefined) patch.recognition_type = body.recognitionType || "MANUAL_CREDIT";
  if (body.approvalStatus !== undefined) patch.approval_status = body.approvalStatus || "APPROVED";
  if (body.substitutionForCourseCode !== undefined) {
    patch.substitution_for_course_code = body.substitutionForCourseCode
      ? normalizeCourseCode(body.substitutionForCourseCode)
      : null;
  }
  if (body.substitutionForCourseName !== undefined) patch.substitution_for_course_name = body.substitutionForCourseName || null;
  if (body.approvalSource !== undefined) patch.approval_source = body.approvalSource || null;
  if (body.approvalNote !== undefined) patch.approval_note = body.approvalNote || null;

  return patch;
}

module.exports = {
  buildStudentCoursePayload,
  validateStudentCoursePayload,
  buildStudentCoursePatch,
  deriveAcademicYearSemester
};
