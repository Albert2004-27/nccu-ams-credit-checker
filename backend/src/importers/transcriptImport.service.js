const { sequelize, Course, TranscriptImport, StudentCourse } = require("../models");
const { normalizeCourseCode, normalizeCredits } = require("../utils/normalizeCourse");
const { parseScoreStatus } = require("../utils/score");

function getLearningRoot(transcript) {
  const root = Array.isArray(transcript) ? transcript[0] : transcript;
  if (!root || !root["課業學習"]) {
    throw new Error("Invalid NCCU transcript JSON: missing 課業學習");
  }
  return root["課業學習"];
}

function flattenGradeRecords(learningRoot) {
  const groups = learningRoot.gradeRecordList || [];
  return groups.flatMap((yearGroup) => yearGroup.GradeRecords || []);
}

function catalogKey(recordOrCourse) {
  const academicYear = recordOrCourse.academicYear || recordOrCourse.academic_year;
  const semester = recordOrCourse.semester;
  const courseCode = recordOrCourse.courseCode || recordOrCourse.course_code;
  const normalizedSemester = String(semester || "").includes("-")
    ? String(semester || "").trim()
    : `${academicYear}-${semester}`;
  return `${normalizedSemester}::${normalizeCourseCode(courseCode)}`;
}

function buildCourseCatalogMap(courses) {
  const map = new Map();
  for (const course of courses) {
    map.set(catalogKey(course), course);
  }
  return map;
}

async function loadCourseCatalogForRecords(records, transaction) {
  const years = [...new Set(records.map((record) => Number(record.academicYear)).filter(Boolean))];
  const courses = await Course.findAll({
    where: { academic_year: years },
    transaction
  });
  return buildCourseCatalogMap(courses);
}

function normalizeTranscriptCourse(userId, record, courseCatalogMap = new Map()) {
  const score = record.score || "";
  const catalogCourse = courseCatalogMap.get(catalogKey(record));
  return {
    user_id: userId,
    course_code: normalizeCourseCode(record.courseCode),
    course_name: String(record.courseName || "").trim(),
    credits: normalizeCredits(record.credit),
    department: catalogCourse?.department || null,
    course_category: catalogCourse?.category || null,
    academic_year: Number(record.academicYear),
    semester: String(record.semester || "").trim(),
    academic_year_semester: String(record.academicYearSemester || "").trim(),
    required_or_elective: record.requiredOrElectiveCourse || null,
    score,
    remark: record.remark || null,
    status: parseScoreStatus(score),
    source: "TRANSCRIPT_JSON",
    recognition_type: "ORIGINAL",
    approval_status: "NOT_REQUIRED",
    substitution_for_course_code: null,
    substitution_for_course_name: null,
    approval_source: null,
    approval_note: null
  };
}

async function importTranscript({ userId, transcript, sourceFilename = "transcript.json" }) {
  const learningRoot = getLearningRoot(transcript);
  const aboutMe = learningRoot.aboutMe || {};
  const coursePlan = learningRoot.coursePlan || {};
  const records = flattenGradeRecords(learningRoot);

  return sequelize.transaction(async (transaction) => {
    const transcriptImport = await TranscriptImport.create({
      user_id: userId,
      source_filename: sourceFilename,
      student_number: aboutMe.studentNumber || null,
      student_name: aboutMe.chineseName || null,
      course_plan_year: coursePlan.coursePlanSchyy || null,
      total_credits_reported: normalizeCredits(learningRoot.totalCredits || coursePlan.graduationCredit),
      raw_json: transcript
    }, { transaction });

    await StudentCourse.destroy({
      where: {
        user_id: userId,
        source: "TRANSCRIPT_JSON"
      },
      transaction
    });

    const statusCounts = {
      PASSED: 0,
      FAILED: 0,
      WITHDRAWN: 0,
      IN_PROGRESS: 0
    };
    let importedCourses = 0;

    const normalizedRows = [];
    const courseCatalogMap = await loadCourseCatalogForRecords(records, transaction);
    const unresolvedCourses = [];
    for (const record of records) {
      const normalized = normalizeTranscriptCourse(userId, record, courseCatalogMap);
      if (!normalized.course_code) continue;
      if (!normalized.department || !normalized.course_category) {
        unresolvedCourses.push({
          courseCode: normalized.course_code,
          courseName: normalized.course_name,
          credits: normalized.credits,
          academicYearSemester: normalized.academic_year_semester,
          score: normalized.score,
          status: normalized.status,
          remark: normalized.remark
        });
      }
      statusCounts[normalized.status] += 1;
      importedCourses += 1;
      normalizedRows.push(normalized);
    }

    if (normalizedRows.length > 0) {
      await StudentCourse.bulkCreate(normalizedRows, { transaction });
    }

    return {
      importId: transcriptImport.id,
      userId,
      studentNumber: aboutMe.studentNumber || null,
      studentName: aboutMe.chineseName || null,
      coursePlanYear: coursePlan.coursePlanSchyy || null,
      importedCourses,
      passedCourses: statusCounts.PASSED,
      failedCourses: statusCounts.FAILED,
      inProgressCourses: statusCounts.IN_PROGRESS,
      withdrawnCourses: statusCounts.WITHDRAWN,
      unresolvedCourseCount: unresolvedCourses.length,
      unresolvedCourses
    };
  });
}

module.exports = {
  getLearningRoot,
  flattenGradeRecords,
  normalizeTranscriptCourse,
  importTranscript
};
