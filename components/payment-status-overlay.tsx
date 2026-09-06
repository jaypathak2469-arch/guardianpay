"use client";

import { CheckCircle2, Clock3, Loader2, ShieldAlert } from "lucide-react";
import { formatInr } from "@/lib/mock-data";
import type { Language } from "@/lib/types";

export type PaymentPhase = "sending" | "success" | "pending" | "locked" | null;

export function PaymentStatusOverlay({
  phase,
  payeeName,
  amount,
  seniorMode,
}: {
  phase: PaymentPhase;
  payeeName?: string;
  amount: number;
  language: Language;
  seniorMode: boolean;
}) {
  if (!phase) return null;

  const copy: Record<Exclude<PaymentPhase, null>, { title: string; sub: string }> = {
    sending: { title: "Sending…", sub: payeeName ? `To ${payeeName}` : "Processing your transfer" },
    success: { title: "Payment sent", sub: `${formatInr(amount)} to ${payeeName ?? "payee"}` },
    pending: { title: "Sent for guardian approval", sub: "You'll be notified once it's reviewed" },
    locked: { title: "Transfer paused", sub: "24-hour cooling-off period started" },
  };

  const { title, sub } = copy[phase];

  return (
    <>
      <style>{`
        @keyframes gp-pop-in {
          0% { transform: scale(0.5); opacity: 0; }
          70% { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes gp-draw-check {
          0% { stroke-dashoffset: 24; }
          100% { stroke-dashoffset: 0; }
        }
        .gp-animated-circle {
          animation: gp-pop-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
        }
        .gp-animated-svg-path {
          stroke-dasharray: 24;
          stroke-dashoffset: 24;
          animation: gp-draw-check 0.45s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards !important;
        }
      `}</style>

      {seniorMode ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white p-6">
          <div className="w-full max-w-md rounded-2xl border-4 border-slate-300 bg-white p-8 text-center shadow-2xl">
            {phase === "sending" ? (
              <Loader2 className="mx-auto h-16 w-16 animate-spin text-[var(--gp-accent)]" />
            ) : phase === "success" ? (
              <CheckCircle2 className="mx-auto h-16 w-16 text-[var(--gp-ok)] gp-animated-circle" />
            ) : phase === "pending" ? (
              <Clock3 className="mx-auto h-16 w-16 text-[var(--gp-warn)] gp-animated-circle" />
            ) : (
              <ShieldAlert className="mx-auto h-16 w-16 text-[var(--gp-warn)] gp-animated-circle" />
            )}
            <p className="mt-4 text-2xl font-bold text-[var(--gp-ink)]">{title}</p>
            <p className="mt-2 text-lg font-medium text-slate-800">{sub}</p>
          </div>
        </div>
      ) : (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-6 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-white/30 bg-white/90 p-8 text-center shadow-2xl backdrop-blur-md dark:border-white/10 dark:bg-[#0F1B2A]/90">
            {phase === "sending" ? (
              <Loader2 className="mx-auto h-14 w-14 animate-spin text-[var(--gp-accent)]" />
            ) : (
              <div
                className="gp-animated-circle mx-auto flex h-16 w-16 items-center justify-center rounded-full"
                style={{ backgroundColor: phase === "success" ? "var(--gp-ok)" : "var(--gp-warn)" }}
              >
                {phase === "success" ? (
                  <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none">
                    <path
                      d="M5 13l4 4L19 7"
                      stroke="white"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="gp-animated-svg-path"
                    />
                  </svg>
                ) : phase === "pending" ? (
                  <Clock3 className="h-8 w-8 text-white" />
                ) : (
                  <ShieldAlert className="h-8 w-8 text-white" />
                )}
              </div>
            )}
            <p className="mt-4 text-xl font-bold tabular-nums text-[var(--gp-ink)] dark:text-white">{title}</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{sub}</p>
          </div>
        </div>
      )}
    </>
  );
}
