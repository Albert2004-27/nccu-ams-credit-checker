import { AlertTriangle, Loader2 } from "lucide-react";

export function LoadingState({ label = "資料載入中" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
      <Loader2 className="h-4 w-4 animate-spin text-navy-700" />
      {label}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <AlertTriangle className="mt-0.5 h-4 w-4" />
      <span>{message}</span>
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
      <h3 className="font-semibold text-navy-900">{title}</h3>
      {description ? <p className="mt-2 text-sm text-slate-500">{description}</p> : null}
    </div>
  );
}
