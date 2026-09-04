"use client";

import { AlertTriangle, Clock3, Shield } from "lucide-react";
import { t } from "@/lib/i18n";
import type { Heuristic, Language, LogEntry, LogKind } from "@/lib/types";
import { RiskGauge } from "./ui/risk-gauge";

const LOG_DOT: Record<LogKind, string> = {
  threat: "bg-[var(--gp-danger)]",
  risk: "bg-[var(--gp-warn)]",
  guardian: "bg-[var(--gp-accent)]",
  transaction: "bg-[var(--gp-ok)]",
  fraud: "bg-[var(--gp-danger)]",
  info: "bg-slate-400",
};

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
  if (seniorMode) {
    return (
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <div className="flex flex-col items-center rounded-xl border-2 border-slate-300 bg-white p-4">
          <RiskGauge score={riskScore} />
          <p className="mt-2 text-center text-lg font-semibold text-slate-800">Live risk score</p>
        </div>
        <div className="space-y-4">
          <section className="rounded-xl border-2 border-slate-300 bg-white p-4">
            <h3 className="text-xl font-bold">Triggered safeguards</h3>
            {heuristics.length === 0 ? (
              <p className="mt-2 text-base text-slate-800">No extra warnings yet. Start a transfer or run a demo scenario.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {heuristics.map((h) => (
                  <li key={h.id} className="rounded-lg border-2 border-slate-200 bg-slate-50 p-3">
                    <p className="font-semibold text-[var(--gp-ink)]">{h.title}</p>
                    <p className="mt-1 text-base text-slate-900">{t(h.explanationKey, language)}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="rounded-xl border-2 border-slate-300 bg-white p-4">
            <h3 className="text-xl font-bold">Event log</h3>
            <ol className="mt-3 max-h-72 space-y-2 overflow-y-auto">
              {eventLog.map((e) => (
                <li key={e.id} className="border-l-4 border-[var(--gp-accent)] pl-3 text-base">
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

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <div
        className="relative overflow-hidden rounded-2xl p-[1px]"
        style={{ backgroundImage: "linear-gradient(135deg, #0F5C6B, #22D3C4)" }}
      >
        <div className="flex h-full flex-col items-center justify-center gap-2 rounded-2xl bg-white/70 p-5 text-center backdrop-blur-md dark:bg-slate-900/70">
          <RiskGauge score={riskScore} />
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Live risk score</p>
        </div>
      </div>
      <div className="space-y-4">
        <section className="rounded-2xl border border-white/20 bg-white/70 p-4 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-slate-900/70">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--gp-accent-soft)] text-[var(--gp-accent)] dark:text-teal-200">
              <Shield className="h-4 w-4" />
            </span>
            <h3 className="text-base font-bold text-[var(--gp-ink)] dark:text-white">Triggered safeguards</h3>
          </div>
          {heuristics.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              No extra warnings yet. Start a transfer or run a demo scenario.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {heuristics.map((h) => (
                <li
                  key={h.id}
                  className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white/60 p-3 dark:border-white/10 dark:bg-white/5"
                >
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-50 text-[var(--gp-warn)] dark:bg-amber-900/30 dark:text-amber-200">
                    <AlertTriangle className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <p className="font-semibold text-[var(--gp-ink)] dark:text-white">{h.title}</p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t(h.explanationKey, language)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-2xl border border-white/20 bg-white/70 p-4 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-slate-900/70">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--gp-accent-soft)] text-[var(--gp-accent)] dark:text-teal-200">
              <Clock3 className="h-4 w-4" />
            </span>
            <h3 className="text-base font-bold text-[var(--gp-ink)] dark:text-white">Event log</h3>
          </div>
          <ol className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
            {eventLog.map((e) => (
              <li key={e.id} className="flex gap-3 text-sm">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${LOG_DOT[e.kind]}`} />
                <div>
                  <time className="font-semibold text-slate-500 dark:text-slate-400">
                    {new Date(e.timestamp).toLocaleTimeString("en-IN")}
                  </time>
                  <p className="font-medium text-[var(--gp-ink)] dark:text-white">{e.message}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
