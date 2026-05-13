import { describe, expect, it } from "vitest";
import { extractStudentAcademicProfile } from "./transcriptProfile";

describe("extractStudentAcademicProfile", () => {
  it("extracts major, double major, minor, and cumulative ranking from NCCU transcript JSON", () => {
    const transcript = [
      {
        課業學習: {
          aboutMe: {
            chineseName: "陳柏澔",
            studentNumber: "111302020",
            registerMajor: "金融學系",
            registerDoubleMajor: "統計學系",
            registerMinor: "應用數學系、會計學系"
          },
          totalAverageScore: {
            rankingDepartment: "4 / 75",
            departmentRankPercentage: "5.33 %",
            averageScore: "94.55",
            totalCredits: "163"
          }
        }
      }
    ];

    expect(extractStudentAcademicProfile(transcript)).toEqual({
      studentName: "陳柏澔",
      studentNumber: "111302020",
      major: "金融學系",
      doubleMajor: "統計學系",
      minor: "應用數學系、會計學系",
      ranking: "4 / 75",
      rankingPercent: "5.33 %",
      averageScore: "94.55",
      totalCredits: "163"
    });
  });

  it("returns null when no academic profile fields are available", () => {
    expect(extractStudentAcademicProfile({ 課業學習: { aboutMe: {} } })).toBeNull();
  });
});
