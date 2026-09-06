"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Clock, Sparkles } from "lucide-react";
import { usePaymentSound } from "@/hooks/use-payment-sound";

import { formatInr } from "@/lib/mock-data";
import type { CoolingOffLock, Language, Payee } from "@/lib/types";
import { PaymentStatusOverlay, type PaymentPhase } from "./payment-status-overlay";
import { Button } from "./ui/button";

export function TransferFlow({
  seniorMode,
  language,
  payees,
  coolingOffLocks,
  riskScore = 6,
  recentPayeeIds = [],
  onSubmit,
  onUnlockRequest,
  onDraftChange,
}: {
  seniorMode: boolean;
  language: Language;
  payees: Payee[];
  coolingOffLocks: CoolingOffLock[];
  riskScore?: number;
  recentPayeeIds?: string[];
  onSubmit: (payee: Payee, amount: number) => void | string;
  onUnlockRequest: (lock: CoolingOffLock) => void;
  onDraftChange?: (payee: Payee, amount: number) => void;
}) {
  const [selectedPayeeId, setSelectedPayeeId] = useState<string>(payees[0]?.id ?? "");
  const [amountStr, setAmountStr] = useState<string>("5000");
  const [phase, setPhase] = useState<PaymentPhase>(null);

  const { playSuccess, playBlocked, playPending } = usePaymentSound();

  const selectedPayee = payees.find((p) => p.id === selectedPayeeId) ?? payees[0];
  const amount = Number(amountStr) || 0;

  useEffect(() => {
    if (selectedPayee && onDraftChange) {
      onDraftChange(selectedPayee, amount);
    }
  }, [selectedPayee, amount, onDraftChange]);

  const activeLock = coolingOffLocks.find(
    (l) => l.payeeId === selectedPayee?.id || l.payeeId === "*",
  );

  const handleExecute = () => {
    if (!selectedPayee || amount <= 0) return;
    setPhase("sending");

    setTimeout(() => {
      const result = onSubmit(selectedPayee, amount);

      if (result === "locked") {
        setPhase("locked");
        playBlocked();
      } else if (result === "guardian-pending") {
        setPhase("pending");
        playPending();
      } else {
        setPhase("success");
        playSuccess();
      }

      setTimeout(() => {
        setPhase(null);
      }, 2500);
    }, 900);
  };

  const field = seniorMode
    ? "w-full rounded-xl border-2 border-slate-400 bg-white px-4 py-3 text-xl text-[var(--gp-ink)]"
    : "w-full rounded-xl border border-slate-300 dark:border-white/15 bg-[var(--gp-surface)] px-4 py-3 text-sm text-[var(--gp-ink)] dark:text-white transition focus:border-[var(--gp-accent)] focus:outline-none";

  return (
    <div className="space-y-6">
      <PaymentStatusOverlay
        phase={phase}
        payeeName={selectedPayee?.name}
        amount={amount}
        language={language}
        seniorMode={seniorMode}
      />

      {/* Payee Selection */}
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Select Payee
        </label>
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          {payees.map((p) => {
            const isSelected = p.id === selectedPayeeId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPayeeId(p.id)}
                className={`flex flex-col items-start rounded-2xl p-4 text-left transition-all ${
                  isSelected
                    ? "border-2 border-[var(--gp-accent)] bg-teal-50/50 shadow-sm dark:bg-teal-950/30"
                    : "border border-slate-200 bg-white hover:border-slate-300 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20"
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="font-bold text-[var(--gp-ink)] dark:text-white">{p.name}</span>
                  {p.trustLevel === "trusted" ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                      Trusted
                    </span>
                  ) : p.trustLevel === "suspicious" ? (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-800 dark:bg-red-900/40 dark:text-red-300">
                      Suspicious
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                      New
                    </span>
                  )}
                </div>
                <span className="mt-1 text-xs text-slate-500 dark:text-slate-400">{p.upiId}</span>
              </button>
            );
          })}
        </div>

        {/* Quick Recent Payees */}
        {recentPayeeIds.length > 0 ? (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Recent:</span>
            <div className="flex flex-wrap gap-1.5">
              {recentPayeeIds.map((id) => {
                const rp = payees.find((x) => x.id === id);
                if (!rp) return null;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSelectedPayeeId(id)}
                    className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/15"
                  >
                    {rp.name}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      {/* Amount Input */}
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Amount (INR)
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
          <input
            type="number"
            className={`${field} pl-9 font-bold tabular-nums`}
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            placeholder="Enter amount"
          />
        </div>
        <div className="mt-2 flex gap-2">
          {[1000, 5000, 15000, 35000, 50000].map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => setAmountStr(String(val))}
              className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/15"
            >
              {formatInr(val)}
            </button>
          ))}
        </div>
      </div>

      {/* Risk Gauge Indicator & Warnings */}
      <div className="rounded-2xl border border-white/40 bg-white/50 p-4 backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[var(--gp-accent)]" />
            <span className="text-sm font-semibold text-[var(--gp-ink)] dark:text-white">
              Real-time Risk Assessment
            </span>
          </div>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
              riskScore >= 70
                ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                : riskScore >= 40
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
            }`}
          >
            {riskScore}% Risk Score
          </span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
          <div
            className={`h-full transition-all duration-500 ${
              riskScore >= 70
                ? "bg-red-500"
                : riskScore >= 40
                  ? "bg-amber-500"
                  : "bg-emerald-500"
            }`}
            style={{ width: `${Math.min(Math.max(riskScore, 4), 100)}%` }}
          />
        </div>
      </div>

      {/* Cooling-off Notice if Locked */}
      {activeLock ? (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-200">
          <div className="flex items-start gap-3">
            <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="font-bold">24-hour cooling-off period active</p>
              <p className="mt-1 text-xs opacity-90">
                First-time large transfers require a cooling period or guardian verification before release.
              </p>
              <Button
                variant="secondary"
                className="mt-3 text-xs"
                onClick={() => onUnlockRequest(activeLock)}
              >
                Request early unlock from guardian
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Submit Button */}
      <Button
        senior={seniorMode}
        className="w-full py-4 text-base font-bold shadow-lg"
        onClick={handleExecute}
        disabled={amount <= 0}
      >
        Send {formatInr(amount)} to {selectedPayee?.name ?? "Payee"} <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}
