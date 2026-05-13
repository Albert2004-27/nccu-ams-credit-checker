import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppStateProvider } from "../state/AppState";
import type { AuditHistoryRow, AuditResult } from "../types/api";
import { AdminAuditHistoryPage } from "./AdminPages";

const useAuditHistoryMock = vi.fn();
const useAuditHistoryDetailMock = vi.fn();

vi.mock("../api/hooks", () => ({
  useAuditHistory: () => useAuditHistoryMock(),
  useAuditHistoryDetail: (id: number | null) => useAuditHistoryDetailMock(id),
  useCourses: vi.fn(),
  useCreateManualCourse: vi.fn(),
  useDeleteManualCourse: vi.fn(),
  useRequirements: vi.fn(),
  useStudentCourses: vi.fn(),
  useUnresolvedCourses: vi.fn()
}));

vi.mock("../components/AuditResultView", () => ({
  AuditResultView: ({ result }: { result: AuditResult }) => (
    <div data-testid="audit-result-view">
      {result.graduationEligible ? "符合畢業資格" : "尚未符合畢業資格"}
    </div>
  )
}));

const auditRow: AuditHistoryRow = {
  id: 12,
  user_id: 1,
  curriculum_id: 1,
  transcript_import_id: null,
  total_credits_earned: 86,
  total_required_credits: 128,
  progress_percentage: 67.19,
  created_at: "2026-05-14T01:17:15.000Z",
  updated_at: "2026-05-14T01:17:15.000Z"
};

const auditResult = {
  academicYear: "111",
  programType: "BACHELOR",
  department: "應用數學系",
  mode: "OFFICIAL",
  isProjected: false,
  progressPercentage: 67.19,
  graduationEligible: false,
  totalCredits: {
    earned: 86,
    required: 128,
    missing: 42,
    source: "calculated",
    officialTranscriptCredits: 163,
    calculatedFromPassedCourses: 164,
    categoryEarnedCredits: 86,
    excludedByRules: 78,
    structure: {
      required: 51,
      physicalEducation: 4,
      generalEducation: 28,
      elective: 45
    }
  },
  groups: [],
  warnings: []
} satisfies AuditResult;

describe("AdminAuditHistoryPage", () => {
  beforeEach(() => {
    const storage = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
      clear: () => storage.clear()
    });
    useAuditHistoryMock.mockReset();
    useAuditHistoryDetailMock.mockReset();
  });

  it("loads selected audit detail before rendering the result panel", () => {
    useAuditHistoryMock.mockReturnValue({
      data: { count: 1, rows: [auditRow] },
      isLoading: false,
      error: null
    });
    useAuditHistoryDetailMock.mockReturnValue({
      data: { ...auditRow, result_json: auditResult },
      isLoading: false,
      error: null
    });

    render(
      <AppStateProvider>
        <AdminAuditHistoryPage />
      </AppStateProvider>
    );

    expect(useAuditHistoryDetailMock).toHaveBeenCalledWith(12);
    expect(screen.getByTestId("audit-result-view")).toHaveTextContent("尚未符合畢業資格");
  });
});
