const { normalizeCourseCode } = require("../../utils/normalizeCourse");
const {
  DEFENSE_ELECTIVE_CREDIT_CAP,
  PHYSICAL_ELECTIVE_CREDIT_CAP,
  PHYSICAL_REQUIRED_COURSES,
  PHYSICAL_REQUIRED_CREDITS
} = require("./auditPolicy");
const { toNumber } = require("./auditShared");

function isPhysicalEducation(studentCourse) {
  const name = studentCourse.course_name || "";
  return name.includes("體育");
}

function isNationalDefense(studentCourse) {
  const name = studentCourse.course_name || "";
  return /國防|軍事訓練|軍訓/.test(name);
}

function analyzePhysicalAndDefense(studentCourses) {
  const physicalCourses = studentCourses.filter(isPhysicalEducation);
  const uniquePhysicalCourses = [];
  const physicalKeys = new Set();
  for (const course of physicalCourses) {
    const key = `${normalizeCourseCode(course.course_code)}::${course.course_name || ""}`;
    if (physicalKeys.has(key)) continue;
    physicalKeys.add(key);
    uniquePhysicalCourses.push(course);
  }
  const requiredPhysicalCourses = uniquePhysicalCourses.slice(0, PHYSICAL_REQUIRED_COURSES);
  const physicalElectiveCourses = uniquePhysicalCourses.slice(PHYSICAL_REQUIRED_COURSES);
  const defenseCourses = studentCourses.filter(isNationalDefense);
  const electiveCappedCourses = [...physicalElectiveCourses, ...defenseCourses];
  const rawPhysicalElectiveCredits = physicalElectiveCourses.reduce((sum, course) => sum + toNumber(course.credits), 0);
  const countedPhysicalElectiveCredits = Math.min(rawPhysicalElectiveCredits, PHYSICAL_ELECTIVE_CREDIT_CAP);
  const rawDefenseCredits = defenseCourses.reduce((sum, course) => sum + toNumber(course.credits), 0);
  const countedDefenseCredits = Math.min(rawDefenseCredits, DEFENSE_ELECTIVE_CREDIT_CAP);
  const rawElectiveCappedCredits = rawPhysicalElectiveCredits + rawDefenseCredits;
  const countedElectiveCappedCredits = countedPhysicalElectiveCredits + countedDefenseCredits;
  const physicalCountedCredits = Math.min(
    requiredPhysicalCourses.reduce((sum, course) => sum + Math.min(toNumber(course.credits), 1), 0),
    PHYSICAL_REQUIRED_CREDITS
  );

  return {
    physicalCourses,
    uniquePhysicalCourses,
    requiredPhysicalCourses,
    physicalElectiveCourses,
    defenseCourses,
    electiveCappedCourses,
    rawPhysicalElectiveCredits,
    countedPhysicalElectiveCredits,
    excludedPhysicalElectiveCredits: Math.max(rawPhysicalElectiveCredits - countedPhysicalElectiveCredits, 0),
    rawDefenseCredits,
    countedDefenseCredits,
    excludedDefenseCredits: Math.max(rawDefenseCredits - countedDefenseCredits, 0),
    rawElectiveCappedCredits,
    countedElectiveCappedCredits,
    excludedElectiveCappedCredits: Math.max(rawElectiveCappedCredits - countedElectiveCappedCredits, 0),
    physicalCountedCredits
  };
}

function buildPhysicalDefenseCapReference(analysis) {
  return {
    appliesTo: "體育選修課與國防課程，採計於其他選修 45 學分內，且各自最多 4 學分",
    rawCredits: analysis.rawElectiveCappedCredits,
    countedCredits: analysis.countedElectiveCappedCredits,
    excludedCredits: analysis.excludedElectiveCappedCredits,
    maxCredits: {
      physicalElective: PHYSICAL_ELECTIVE_CREDIT_CAP,
      defense: DEFENSE_ELECTIVE_CREDIT_CAP
    },
    physicalElective: {
      rawCredits: analysis.rawPhysicalElectiveCredits,
      countedCredits: analysis.countedPhysicalElectiveCredits,
      excludedCredits: analysis.excludedPhysicalElectiveCredits,
      maxCredits: PHYSICAL_ELECTIVE_CREDIT_CAP,
      courses: analysis.physicalElectiveCourses.map((course) => ({
        courseCode: course.course_code,
        courseName: course.course_name,
        credits: toNumber(course.credits)
      }))
    },
    defense: {
      rawCredits: analysis.rawDefenseCredits,
      countedCredits: analysis.countedDefenseCredits,
      excludedCredits: analysis.excludedDefenseCredits,
      maxCredits: DEFENSE_ELECTIVE_CREDIT_CAP,
      courses: analysis.defenseCourses.map((course) => ({
        courseCode: course.course_code,
        courseName: course.course_name,
        credits: toNumber(course.credits)
      }))
    },
    defenseCourses: analysis.defenseCourses.map((course) => ({
      courseCode: course.course_code,
      courseName: course.course_name,
      credits: toNumber(course.credits)
    }))
  };
}

function checkPhysicalEducationGroup(group, physicalAndDefenseAnalysis) {
  const earnedCourses = physicalAndDefenseAnalysis.requiredPhysicalCourses.length;
  const requiredCourses = Number(group.min_courses || PHYSICAL_REQUIRED_COURSES);
  const earnedCredits = physicalAndDefenseAnalysis.physicalCountedCredits;

  return {
    groupCode: group.group_code,
    groupName: group.group_name,
    status: earnedCourses >= requiredCourses && earnedCredits >= PHYSICAL_REQUIRED_CREDITS ? "COMPLETE" : "INCOMPLETE",
    earnedCredits,
    requiredCredits: PHYSICAL_REQUIRED_CREDITS,
    missingCredits: Math.max(PHYSICAL_REQUIRED_CREDITS - earnedCredits, 0),
    earnedCourses,
    requiredCourses,
    missingCourses: [],
    courses: physicalAndDefenseAnalysis.requiredPhysicalCourses.map((course) => ({
      courseCode: course.course_code,
      courseName: course.course_name,
      credits: toNumber(course.credits),
      countedCredits: Math.min(toNumber(course.credits), 1)
    })),
    duplicateOrExtraPhysicalCourses: physicalAndDefenseAnalysis.physicalCourses
      .filter((course) => !physicalAndDefenseAnalysis.requiredPhysicalCourses.includes(course))
      .map((course) => ({
        courseCode: course.course_code,
        courseName: course.course_name,
        credits: toNumber(course.credits)
      })),
    electiveCreditCapReference: buildPhysicalDefenseCapReference(physicalAndDefenseAnalysis)
  };
}

module.exports = {
  analyzePhysicalAndDefense,
  buildPhysicalDefenseCapReference,
  checkPhysicalEducationGroup
};
