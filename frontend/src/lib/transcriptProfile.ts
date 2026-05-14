export type StudentAcademicProfile = {
  studentName?: string;
  studentNumber?: string;
  major?: string;
  doubleMajor?: string;
  minor?: string;
  ranking?: string;
  rankingPercent?: string;
  classRanking?: string;
  classRankingPercent?: string;
  averageScore?: string;
  totalCredits?: string;
  cumulativeGpa?: string;
  rankings?: StudentRanking[];
  semesterSummaries?: SemesterAcademicSummary[];
};

export type StudentRanking = {
  label: string;
  value: string;
  percent?: string;
};

export type SemesterAcademicSummary = {
  academicYear: string;
  semester: string;
  academicYearSemester: string;
  averageScore?: string;
  totalCredits?: string;
  gpa?: string;
  departmentRanking?: string;
  departmentRankPercent?: string;
  classRanking?: string;
  classRankPercent?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function cleanText(value: unknown) {
  const text = typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
  return text || undefined;
}

function firstText(...values: unknown[]) {
  for (const value of values) {
    const text = cleanText(value);
    if (text) return text;
  }
  return undefined;
}

function joinText(...values: unknown[]) {
  const parts = values.map(cleanText).filter((value): value is string => Boolean(value));
  return parts.length ? [...new Set(parts)].join("、") : undefined;
}

function getLearningRoot(transcript: unknown) {
  const root = Array.isArray(transcript) ? transcript[0] : transcript;
  if (!isRecord(root)) return null;
  const learning = root["課業學習"];
  return isRecord(learning) ? learning : null;
}

function recordsOf(value: unknown) {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function formatRanking(numerator: unknown, denominator: unknown) {
  const rankingNumerator = cleanText(numerator);
  const rankingDenominator = cleanText(denominator);
  return rankingNumerator && rankingDenominator ? `${rankingNumerator} / ${rankingDenominator}` : undefined;
}

function scoreToGpaPoint(score: unknown) {
  const value = Number.parseFloat(String(score ?? "").trim());
  if (!Number.isFinite(value)) return null;
  if (value >= 90) return 4.3;
  if (value >= 85) return 4.0;
  if (value >= 80) return 3.7;
  if (value >= 77) return 3.3;
  if (value >= 73) return 3.0;
  if (value >= 70) return 2.7;
  if (value >= 67) return 2.3;
  if (value >= 63) return 2.0;
  if (value >= 60) return 1.7;
  if (value >= 50) return 1.0;
  return 0;
}

function normalizeCredit(value: unknown) {
  const credit = Number.parseFloat(String(value ?? "").trim());
  return Number.isFinite(credit) && credit > 0 ? credit : null;
}

function flattenGradeRecords(learningRoot: Record<string, unknown>) {
  return recordsOf(learningRoot.gradeRecordList).flatMap((yearGroup) => recordsOf(yearGroup.GradeRecords));
}

function calculateGpa(records: Array<Record<string, unknown>>) {
  let weighted = 0;
  let credits = 0;
  for (const record of records) {
    const point = scoreToGpaPoint(record.score);
    const credit = normalizeCredit(record.credit);
    if (point === null || credit === null) continue;
    weighted += point * credit;
    credits += credit;
  }
  return credits > 0 ? (weighted / credits).toFixed(2) : undefined;
}

function academicYearSemesterOf(row: Record<string, unknown>) {
  const direct = cleanText(row.academicYearSemester);
  if (direct) return direct;
  const academicYear = cleanText(row.academicYear);
  const semester = cleanText(row.semester);
  return academicYear && semester ? `${academicYear}${semester}` : undefined;
}

function buildRankings(totalAverageScore: Record<string, unknown>, learningRoot: Record<string, unknown>) {
  const departmentRanking = firstText(
    totalAverageScore.rankingDepartment,
    formatRanking(totalAverageScore.rankingDepartmentNumer, totalAverageScore.rankingDepartmentDenom),
    formatRanking(learningRoot.rankingDepartment, learningRoot.rankingDepartmentDenom)
  );
  const classRanking = firstText(
    totalAverageScore.rankingClass,
    formatRanking(totalAverageScore.rankingClassNumer, totalAverageScore.rankingClassDenom),
    formatRanking(learningRoot.rankingClass, learningRoot.rankingClassDenom)
  );
  const departmentRankPercent = firstText(totalAverageScore.departmentRankPercentage);
  const classRankPercent = firstText(totalAverageScore.classRankPercentage);
  const rankings: StudentRanking[] = [];
  if (departmentRanking) rankings.push({ label: "系排名", value: departmentRanking, percent: departmentRankPercent });
  if (classRanking) rankings.push({ label: "班排名", value: classRanking, percent: classRankPercent });

  return {
    departmentRanking,
    departmentRankPercent,
    classRanking,
    classRankPercent,
    rankings
  };
}

function buildSemesterSummaries(learningRoot: Record<string, unknown>) {
  const gradeRecords = flattenGradeRecords(learningRoot);
  return recordsOf(learningRoot.averageScoreList).map((row) => {
    const academicYear = cleanText(row.academicYear) || "";
    const semester = cleanText(row.semester) || "";
    const academicYearSemester = academicYear && semester ? `${academicYear}${semester}` : "";
    const semesterRecords = gradeRecords.filter((record) => academicYearSemesterOf(record) === academicYearSemester);
    return {
      academicYear,
      semester,
      academicYearSemester,
      averageScore: firstText(row.averageScore),
      totalCredits: firstText(row.totalCredits),
      gpa: calculateGpa(semesterRecords),
      departmentRanking: firstText(row.rankingDepartment, formatRanking(row.rankingDepartmentNumer, row.rankingDepartmentDenom)),
      departmentRankPercent: firstText(row.departmentRankPercentage),
      classRanking: firstText(row.rankingClass, formatRanking(row.rankingClassNumer, row.rankingClassDenom)),
      classRankPercent: firstText(row.classRankPercentage)
    };
  }).filter((summary) => summary.academicYear && summary.semester);
}

export function extractStudentAcademicProfile(transcript: unknown): StudentAcademicProfile | null {
  const learningRoot = getLearningRoot(transcript);
  if (!learningRoot) return null;

  const aboutMe = isRecord(learningRoot.aboutMe) ? learningRoot.aboutMe : {};
  const totalAverageScore = isRecord(learningRoot.totalAverageScore) ? learningRoot.totalAverageScore : {};
  const rankingInfo = buildRankings(totalAverageScore, learningRoot);
  const semesterSummaries = buildSemesterSummaries(learningRoot);
  const cumulativeGpa = calculateGpa(flattenGradeRecords(learningRoot));

  const profile: StudentAcademicProfile = {
    studentName: firstText(aboutMe.chineseName),
    studentNumber: firstText(aboutMe.studentNumber),
    major: firstText(aboutMe.registerMajor),
    doubleMajor: firstText(aboutMe.registerDoubleMajor, aboutMe.doubleMajor),
    minor: firstText(aboutMe.registerMinor, joinText(aboutMe.minor1, aboutMe.minor2)),
    ranking: rankingInfo.departmentRanking,
    rankingPercent: rankingInfo.departmentRankPercent,
    classRanking: rankingInfo.classRanking,
    classRankingPercent: rankingInfo.classRankPercent,
    averageScore: firstText(totalAverageScore.averageScore),
    totalCredits: firstText(totalAverageScore.totalCredits, learningRoot.totalCredits),
    cumulativeGpa,
    rankings: rankingInfo.rankings.length ? rankingInfo.rankings : undefined,
    semesterSummaries: semesterSummaries.length ? semesterSummaries : undefined
  };

  const hasVisibleProfile = [
    profile.studentName,
    profile.studentNumber,
    profile.major,
    profile.doubleMajor,
    profile.minor,
    profile.ranking,
    profile.classRanking,
    profile.rankingPercent,
    profile.averageScore,
    profile.cumulativeGpa,
    profile.semesterSummaries?.length
  ].some(Boolean);

  return hasVisibleProfile ? profile : null;
}
