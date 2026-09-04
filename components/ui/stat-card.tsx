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
    <div className="group rounded-2xl border border-white/40 bg-white/60 p-5 shadow-sm backdrop-blur-sm transition-transform hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{label}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-[var(--gp-ink)] dark:text-white">
            {value}
          </p>
          {hint ? <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{hint}</p> : null}
        </div>
        {icon ? (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--gp-accent-soft)] text-[var(--gp-accent)] dark:text-teal-200">
            {icon}
          </div>
        ) : null}
      </div>
    </div>
  );
}
