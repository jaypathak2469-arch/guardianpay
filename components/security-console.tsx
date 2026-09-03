"use client";

import { t } from "@/lib/i18n";
import type { Heuristic, Language, LogEntry } from "@/lib/types";
import { RiskGauge } from "./ui/risk-gauge";

export function SecurityConsole({
  riskScore,
  heuristics,
  eventLog,
  language,
  seniorMode,
}: {
  riskScore: number;
  heuristics: Heuristic[];
  eventLog: LogEntry[];
  language: Language;
  seniorMode: boolean;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <div className="flex flex-col items-center rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <RiskGauge score={riskScore} />
        <p className="mt-2 text-center text-sm font-semibold text-slate-800">Live risk score</p>
      </div>
      <div className="space-y-4">
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className={`font-bold ${seniorMode ? "text-xl" : "text-base"}`}>Triggered safeguards</h3>
          {heuristics.length === 0 ? (
            <p className="mt-2 text-sm text-slate-800">No extra warnings yet. Start a transfer or run a demo scenario.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {heuristics.map((h) => (
                <li key={h.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="font-semibold text-[var(--gp-ink)]">{h.title}</p>
                  <p className={`mt-1 text-slate-900 ${seniorMode ? "text-base" : "text-sm"}`}>
                    {t(h.explanationKey, language)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className={`font-bold ${seniorMode ? "text-xl" : "text-base"}`}>Event log</h3>
          <ol className="mt-3 max-h-72 space-y-2 overflow-y-auto">
            {eventLog.map((e) => (
              <li key={e.id} className="border-l-4 border-[var(--gp-accent)] pl-3 text-sm">
                <time className="font-semibold text-slate-800">
                  {new Date(e.timestamp).toLocaleTimeString("en-IN")}
                </time>
                <p className="font-medium text-[var(--gp-ink)]">{e.message}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
