export type StudentAcademicProfile = {
  studentName?: string;
  studentNumber?: string;
  major?: string;
  doubleMajor?: string;
  minor?: string;
  ranking?: string;
  rankingPercent?: string;
  averageScore?: string;
  totalCredits?: string;
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

function formatRanking(numerator: unknown, denominator: unknown) {
  const rankingNumerator = cleanText(numerator);
  const rankingDenominator = cleanText(denominator);
  return rankingNumerator && rankingDenominator ? `${rankingNumerator} / ${rankingDenominator}` : undefined;
}

export function extractStudentAcademicProfile(transcript: unknown): StudentAcademicProfile | null {
  const learningRoot = getLearningRoot(transcript);
  if (!learningRoot) return null;

  const aboutMe = isRecord(learningRoot.aboutMe) ? learningRoot.aboutMe : {};
  const totalAverageScore = isRecord(learningRoot.totalAverageScore) ? learningRoot.totalAverageScore : {};

  const profile: StudentAcademicProfile = {
    studentName: firstText(aboutMe.chineseName),
    studentNumber: firstText(aboutMe.studentNumber),
    major: firstText(aboutMe.registerMajor),
    doubleMajor: firstText(aboutMe.registerDoubleMajor, aboutMe.doubleMajor),
    minor: firstText(aboutMe.registerMinor, joinText(aboutMe.minor1, aboutMe.minor2)),
    ranking: firstText(
      totalAverageScore.rankingDepartment,
      formatRanking(totalAverageScore.rankingDepartmentNumer, totalAverageScore.rankingDepartmentDenom),
      formatRanking(learningRoot.rankingDepartment, learningRoot.rankingDepartmentDenom)
    ),
    rankingPercent: firstText(totalAverageScore.departmentRankPercentage),
    averageScore: firstText(totalAverageScore.averageScore),
    totalCredits: firstText(totalAverageScore.totalCredits, learningRoot.totalCredits)
  };

  const hasVisibleProfile = [
    profile.studentName,
    profile.studentNumber,
    profile.major,
    profile.doubleMajor,
    profile.minor,
    profile.ranking,
    profile.rankingPercent,
    profile.averageScore
  ].some(Boolean);

  return hasVisibleProfile ? profile : null;
}
