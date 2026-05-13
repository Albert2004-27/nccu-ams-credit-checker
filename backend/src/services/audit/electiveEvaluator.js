const { normalizeCourseCode } = require("../../utils/normalizeCourse");
const {
  DEFENSE_ELECTIVE_CREDIT_CAP,
  OTHER_ELECTIVE_REQUIRED_CREDITS,
  PHYSICAL_ELECTIVE_CREDIT_CAP
} = require("./auditPolicy");
const { toNumber } = require("./auditShared");

function coursePayload(course, countedCredits = toNumber(course.credits), reason = null) {
  const payload = {
    courseCode: course.course_code,
    courseName: course.course_name,
    credits: toNumber(course.credits),
    countedCredits
  };
  if (reason) payload.reason = reason;
  return payload;
}

function checkOtherElectiveGroup(group, passedCourses, requiredCodes, generalAnalysis, physicalAndDefenseAnalysis) {
  const generalCodes = new Set([
    ...generalAnalysis.courses.map((course) => course.courseCode),
    ...generalAnalysis.uncountedCourses.map((course) => course.courseCode)
  ]);
  const requiredPhysicalCodes = new Set(
    physicalAndDefenseAnalysis.requiredPhysicalCourses.map((course) => normalizeCourseCode(course.course_code))
  );
  const electiveCappedCodes = new Set(
    physicalAndDefenseAnalysis.electiveCappedCourses.map((course) => normalizeCourseCode(course.course_code))
  );
  const physicalElectiveCodes = new Set(
    physicalAndDefenseAnalysis.physicalElectiveCourses.map((course) => normalizeCourseCode(course.course_code))
  );
  const defenseCodes = new Set(
    physicalAndDefenseAnalysis.defenseCourses.map((course) => normalizeCourseCode(course.course_code))
  );

  const ordinaryCourses = [];
  const physicalDefenseCourses = [];

  for (const course of passedCourses) {
    const code = normalizeCourseCode(course.course_code);
    if (requiredCodes.has(code)) continue;
    if (generalCodes.has(code)) continue;
    if (requiredPhysicalCodes.has(code)) continue;

    if (electiveCappedCodes.has(code)) {
      physicalDefenseCourses.push({
        course,
        capType: defenseCodes.has(code) ? "DEFENSE" : physicalElectiveCodes.has(code) ? "PHYSICAL_ELECTIVE" : "UNKNOWN"
      });
    } else {
      ordinaryCourses.push(course);
    }
  }

  let remainingPhysicalElectiveCap = PHYSICAL_ELECTIVE_CREDIT_CAP;
  let remainingDefenseCap = DEFENSE_ELECTIVE_CREDIT_CAP;
  const countedPhysicalDefenseCourses = [];
  const uncountedCourses = [];
  for (const { course, capType } of physicalDefenseCourses) {
    const credits = toNumber(course.credits);
    const remainingCap = capType === "DEFENSE" ? remainingDefenseCap : remainingPhysicalElectiveCap;
    const countedCredits = Math.min(credits, remainingCap);
    if (capType === "DEFENSE") {
      remainingDefenseCap = Math.max(remainingDefenseCap - countedCredits, 0);
    } else {
      remainingPhysicalElectiveCap = Math.max(remainingPhysicalElectiveCap - countedCredits, 0);
    }
    if (countedCredits > 0) {
      countedPhysicalDefenseCourses.push({
        ...coursePayload(course, countedCredits),
        capType
      });
    }
    if (countedCredits < credits) {
      const reason = capType === "DEFENSE"
        ? "國防課程超過 4 學分，不採計為其他選修"
        : "體育選修課超過 4 學分，不採計為其他選修";
      uncountedCourses.push({
        ...coursePayload(course, 0, reason),
        capType,
        excessCredits: credits - countedCredits
      });
    }
  }

  const ordinaryCredits = ordinaryCourses.reduce((sum, course) => sum + toNumber(course.credits), 0);
  const physicalDefenseCredits = countedPhysicalDefenseCourses.reduce((sum, course) => sum + course.countedCredits, 0);
  const rawCredits = ordinaryCredits + physicalDefenseCourses.reduce((sum, item) => sum + toNumber(item.course.credits), 0);
  const capEligibleCredits = ordinaryCredits + physicalDefenseCredits;
  const earnedCredits = Math.min(capEligibleCredits, OTHER_ELECTIVE_REQUIRED_CREDITS);
  const countedCourses = [];
  let remainingElectiveCredits = OTHER_ELECTIVE_REQUIRED_CREDITS;
  const capEligibleCourses = [
    ...ordinaryCourses.map((course) => coursePayload(course)),
    ...countedPhysicalDefenseCourses
  ];

  for (const course of capEligibleCourses) {
    const countedCredits = Math.min(course.countedCredits, remainingElectiveCredits);
    remainingElectiveCredits = Math.max(remainingElectiveCredits - countedCredits, 0);
    if (countedCredits > 0) {
      countedCourses.push({ ...course, countedCredits });
    }
    if (countedCredits < course.countedCredits) {
      uncountedCourses.push({
        ...course,
        countedCredits: 0,
        excessCredits: course.countedCredits - countedCredits,
        reason: "其他選修超過 45 學分，不採計為畢業學分"
      });
    }
  }

  const requiredCredits = toNumber(group.min_credits) || OTHER_ELECTIVE_REQUIRED_CREDITS;
  return {
    groupCode: group.group_code,
    groupName: group.group_name,
    status: earnedCredits >= requiredCredits ? "COMPLETE" : "INCOMPLETE",
    rawCredits,
    earnedCredits,
    requiredCredits,
    missingCredits: Math.max(requiredCredits - earnedCredits, 0),
    creditCap: OTHER_ELECTIVE_REQUIRED_CREDITS,
    missingCourses: [],
    courses: countedCourses,
    uncountedCourses,
    physicalAndDefenseElectiveCap: {
      policy: "體育選修課與國防課程各自最多採計 4 學分，且都只算入其他選修 45 學分內",
      rawCredits: physicalAndDefenseAnalysis.rawElectiveCappedCredits,
      countedCredits: physicalDefenseCredits,
      excludedCredits: Math.max(physicalAndDefenseAnalysis.rawElectiveCappedCredits - physicalDefenseCredits, 0),
      maxCredits: {
        physicalElective: PHYSICAL_ELECTIVE_CREDIT_CAP,
        defense: DEFENSE_ELECTIVE_CREDIT_CAP
      },
      physicalElective: {
        rawCredits: physicalAndDefenseAnalysis.rawPhysicalElectiveCredits,
        countedCredits: Math.min(
          physicalAndDefenseAnalysis.rawPhysicalElectiveCredits,
          PHYSICAL_ELECTIVE_CREDIT_CAP
        ),
        excludedCredits: physicalAndDefenseAnalysis.excludedPhysicalElectiveCredits,
        maxCredits: PHYSICAL_ELECTIVE_CREDIT_CAP
      },
      defense: {
        rawCredits: physicalAndDefenseAnalysis.rawDefenseCredits,
        countedCredits: Math.min(physicalAndDefenseAnalysis.rawDefenseCredits, DEFENSE_ELECTIVE_CREDIT_CAP),
        excludedCredits: physicalAndDefenseAnalysis.excludedDefenseCredits,
        maxCredits: DEFENSE_ELECTIVE_CREDIT_CAP
      }
    }
  };
}

module.exports = {
  checkOtherElectiveGroup
};
