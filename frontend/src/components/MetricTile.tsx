import type { ReactNode } from "react";

export function MetricTile({ label, value, detail, icon }: { label: string; value: ReactNode; detail?: string; icon?: ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <div className="mt-2 text-3xl font-bold text-navy-900">{value}</div>
        </div>
        {icon ? <div className="rounded-md bg-navy-50 p-2 text-navy-700">{icon}</div> : null}
      </div>
      {detail ? <p className="mt-2 text-sm text-slate-500">{detail}</p> : null}
    </div>
  );
}
