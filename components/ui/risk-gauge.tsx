"use client";

export function RiskGauge({ score, size = 160 }: { score: number; size?: number }) {
  const clamped = Math.max(0, Math.min(100, score));
  const r = 54;
  const c = 2 * Math.PI * r;
  const offset = c - (clamped / 100) * c;
  const color =
    clamped >= 70 ? "var(--gp-danger)" : clamped >= 40 ? "var(--gp-warn)" : "var(--gp-ok)";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#e2e8f0" strokeWidth="12" />
        <circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-[var(--gp-ink)]">{clamped}%</span>
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-700">Risk</span>
      </div>
    </div>
  );
}
