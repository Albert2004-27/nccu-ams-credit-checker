import { clsx } from "clsx";
import { getStatusTone, type StatusTone } from "../lib/status";

const toneClasses: Record<StatusTone, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  danger: "border-red-200 bg-red-50 text-red-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  info: "border-sky-200 bg-sky-50 text-sky-700",
  muted: "border-slate-200 bg-slate-50 text-slate-600",
  navy: "border-navy-100 bg-navy-50 text-navy-800"
};

const labels: Record<string, string> = {
  PASSED: "已通過",
  FAILED: "未通過",
  WITHDRAWN: "停修",
  IN_PROGRESS: "修課中",
  TRANSCRIPT_JSON: "成績匯入",
  MANUAL: "人工調整",
  COMPLETE: "完成",
  INCOMPLETE: "未完成",
  UNSUPPORTED: "未支援",
  APPROVED: "已核准",
  PENDING: "待確認",
  REJECTED: "已拒絕",
  NOT_REQUIRED: "不需審核",
  ORIGINAL: "原始課程",
  APPROVED_SUBSTITUTION: "核准替代",
  MANUAL_CREDIT: "人工認列"
};

export function StatusBadge({ value, tone }: { value: string; tone?: StatusTone }) {
  const resolvedTone = tone || getStatusTone(value);
  return (
    <span className={clsx("inline-flex items-center rounded-md border px-2 py-1 text-xs font-semibold", toneClasses[resolvedTone])}>
      {labels[value] || value}
    </span>
  );
}
