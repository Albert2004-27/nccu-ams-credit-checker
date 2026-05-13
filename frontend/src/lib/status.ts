import type { StudentCourseStatus } from "../types/api";

export type StatusTone = "success" | "danger" | "warning" | "info" | "muted" | "navy";

export function getAuditEligibilityLabel(eligible: boolean) {
  return eligible ? "符合畢業資格" : "尚未符合畢業資格";
}

export function getStatusTone(status: StudentCourseStatus | string): StatusTone {
  switch (status) {
    case "PASSED":
    case "COMPLETE":
    case "APPROVED":
      return "success";
    case "FAILED":
    case "INCOMPLETE":
    case "REJECTED":
      return "danger";
    case "WITHDRAWN":
    case "NOT_REQUIRED":
      return "muted";
    case "IN_PROGRESS":
      return "info";
    case "PENDING":
      return "warning";
    default:
      return "navy";
  }
}

export function formatCredits(value: string | number | null | undefined) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n.toFixed(n % 1 === 0 ? 0 : 1) : "0";
}
