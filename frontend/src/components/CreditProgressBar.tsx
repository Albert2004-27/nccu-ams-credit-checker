export function CreditProgressBar({ value, max, label }: { value: number; max: number; label?: string }) {
  const percentage = max <= 0 ? 0 : Math.min(100, Math.round((value / max) * 100));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium text-slate-600">{label || "完成率"}</span>
        <span className="font-semibold text-navy-800">{percentage}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-200">
        <div className="h-2 rounded-full bg-navy-700" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
