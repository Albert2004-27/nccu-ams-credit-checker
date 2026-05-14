import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AuditResultView } from "./AuditResultView";
import type { AuditResult } from "../types/api";

const baseResult: AuditResult = {
  academicYear: "113",
  programType: "UNDERGRADUATE",
  department: "應用數學系",
  mode: "OFFICIAL",
  isProjected: false,
  progressPercentage: 100,
  graduationEligible: true,
  totalCredits: {
    earned: 128,
    required: 128,
    missing: 0,
    source: "calculated",
    officialTranscriptCredits: null,
    calculatedFromPassedCourses: 128,
    categoryEarnedCredits: 128,
    excludedByRules: 3,
    structure: {
      required: 70,
      physicalEducation: 0,
      generalEducation: 28,
      elective: 30
    }
  },
  warnings: [],
  groups: [
    {
      groupCode: "GENERAL",
      groupName: "通識",
      status: "COMPLETE",
      earnedCredits: 28,
      requiredCredits: 28,
      missingCredits: 0,
      requirements: [
        {
          bucketCode: "HUMANITIES",
          bucketName: "人文學",
          status: "COMPLETE",
          rawCredits: 7,
          earnedCredits: 7,
          minCredits: 3,
          maxCredits: 7,
          missingCredits: 0,
          excessCredits: 0,
          courses: [
            { courseCode: "H1", courseName: "哲學概論", isCore: true }
          ]
        },
        {
          bucketCode: "SOCIAL",
          bucketName: "社會科學",
          status: "COMPLETE",
          rawCredits: 4,
          earnedCredits: 4,
          minCredits: 3,
          maxCredits: 7,
          missingCredits: 0,
          excessCredits: 0,
          courses: [
            { courseCode: "S1", courseName: "政治學", isCore: true }
          ]
        }
      ],
      coreRequirement: {
        status: "COMPLETE",
        requiredDistinctDomains: 2,
        earnedDistinctDomains: 2,
        earnedDistinctCourses: 2,
        earnedDomains: ["人文學", "社會科學"],
        courses: [
          { courseCode: "H1", courseName: "哲學概論", assignedBucket: "HUMANITIES", bucketName: "人文學" },
          { courseCode: "S1", courseName: "政治學", assignedBucket: "SOCIAL", bucketName: "社會科學" }
        ],
        missingDistinctDomains: 0
      }
    }
  ]
};

describe("AuditResultView", () => {
  it("shows general education official names, credit ranges, and completed core courses", () => {
    render(<AuditResultView result={baseResult} />);

    expect(screen.getByText("人文學通識")).toBeInTheDocument();
    expect(screen.getByText("社會科學通識")).toBeInTheDocument();
    expect(screen.getByText("7 / 3-7 學分")).toBeInTheDocument();

    expect(screen.getByText("核心通識課程")).toBeInTheDocument();
    expect(screen.getByText("人文學：哲學概論")).toBeInTheDocument();
    expect(screen.getByText("社會科學：政治學")).toBeInTheDocument();
  });

  it("shows imported student academic profile above warnings", () => {
    render(
      <AuditResultView
        result={baseResult}
        studentProfile={{
          major: "金融學系",
          doubleMajor: "統計學系",
          minor: "應用數學系、會計學系",
          ranking: "4 / 75",
          rankingPercent: "5.33 %",
          averageScore: "94.55"
        }}
      />
    );

    expect(screen.getByText("學生學籍資訊")).toBeInTheDocument();
    expect(screen.getAllByText("金融學系").length).toBeGreaterThan(0);
    expect(screen.getByText("統計學系")).toBeInTheDocument();
    expect(screen.getByText("應用數學系、會計學系")).toBeInTheDocument();
    expect(screen.getAllByText("成績 Ranking").length).toBeGreaterThan(0);
    expect(screen.getAllByText("4 / 75（前 5.33 %）").length).toBeGreaterThan(0);
    expect(screen.getAllByText("平均成績").length).toBeGreaterThan(0);
    expect(screen.getAllByText("94.55").length).toBeGreaterThan(0);
  });

  it("shows every missing required course in action required", () => {
    const incompleteResult: AuditResult = {
      ...baseResult,
      graduationEligible: false,
      progressPercentage: 67.2,
      totalCredits: {
        ...baseResult.totalCredits,
        earned: 86,
        missing: 42,
        excludedByRules: 78
      },
      groups: [
        {
          groupCode: "REQUIRED",
          groupName: "系必修",
          status: "INCOMPLETE",
          earnedCredits: 9,
          requiredCredits: 51,
          missingCredits: 42,
          missingCourses: [
            { courseName: "微積分（上學期）" },
            { courseName: "微積分（下學期）" },
            { courseName: "計算機程式" },
            { courseName: "離散數學" },
            { courseName: "高等微積分（上學期）" }
          ]
        },
        {
          groupCode: "ELECTIVE",
          groupName: "其他選修",
          status: "COMPLETE",
          earnedCredits: 45,
          requiredCredits: 45,
          missingCredits: 0,
          uncountedCourses: [
            { courseName: "人工智慧方法與工具" },
            { courseName: "國際金融" }
          ]
        }
      ]
    };

    render(<AuditResultView result={incompleteResult} />);

    expect(screen.getByText("缺少：微積分（上學期）")).toBeInTheDocument();
    expect(screen.getByText("缺少：微積分（下學期）")).toBeInTheDocument();
    expect(screen.getByText("缺少：計算機程式")).toBeInTheDocument();
    expect(screen.getByText("缺少：離散數學")).toBeInTheDocument();
    expect(screen.getByText("缺少：高等微積分（上學期）")).toBeInTheDocument();
    expect(screen.getByText("有 2 門課不可採計")).toBeInTheDocument();
  });
});
