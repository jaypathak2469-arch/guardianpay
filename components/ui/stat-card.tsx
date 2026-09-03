import { ReactNode } from "react";

export function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-800">{label}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-[var(--gp-ink)]">{value}</p>
          {hint ? <p className="mt-1 text-sm text-slate-700">{hint}</p> : null}
        </div>
        {icon ? <div className="text-[var(--gp-accent)]">{icon}</div> : null}
      </div>
    </div>
  );
}
