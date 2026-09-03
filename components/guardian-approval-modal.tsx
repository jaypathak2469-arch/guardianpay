"use client";

import { useEffect, useState } from "react";
import { LoaderCircle, UserCheck } from "lucide-react";
import { t } from "@/lib/i18n";
import { formatInr } from "@/lib/mock-data";
import type { GuardianContact, Language, Payee } from "@/lib/types";
import { Button } from "./ui/button";

type Phase = "notify" | "await" | "choose";

export function GuardianApprovalModal({
  language,
  seniorMode,
  guardian,
  payee,
  amount,
  reasons,
  earlyUnlock,
  onApprove,
  onDeny,
}: {
  language: Language;
  seniorMode: boolean;
  guardian: GuardianContact;
  payee: Payee | null;
  amount: number;
  reasons: string[];
  earlyUnlock: boolean;
  onApprove: () => void;
  onDeny: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("notify");
  const [seconds, setSeconds] = useState(25);

  useEffect(() => {
    const t1 = window.setTimeout(() => setPhase("await"), 1500);
    return () => window.clearTimeout(t1);
  }, []);

  useEffect(() => {
    if (phase !== "await") return;
    const id = window.setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4">
      <div role="dialog" aria-modal="true" className="w-full max-w-lg rounded-2xl border-2 border-slate-400 bg-white p-6">
        <div className="flex items-center gap-2">
          <UserCheck className="h-6 w-6 text-[var(--gp-accent)]" />
          <h2 className={`font-bold ${seniorMode ? "text-2xl" : "text-xl"}`}>{t("g.title", language)}</h2>
        </div>
        <div className="mt-4 rounded-xl bg-slate-50 p-4 text-[var(--gp-ink)]">
          <p className="font-semibold">{payee?.name ?? "Transfer"}</p>
          <p className="text-sm">{payee?.upiId}</p>
          <p className={`mt-2 font-bold ${seniorMode ? "text-2xl" : "text-xl"}`}>{formatInr(amount)}</p>
          {earlyUnlock ? <p className="mt-2 text-sm font-semibold">{t("g.unlock", language)}</p> : null}
        </div>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm font-medium text-slate-900">
          {reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        <div className="mt-4 rounded-xl border border-slate-300 p-4">
          {phase === "notify" ? (
            <p className="flex items-center gap-2 font-semibold">
              <LoaderCircle className="h-5 w-5 animate-spin" />
              {t("g.notify", language, { name: guardian.name })}
            </p>
          ) : null}
          {phase === "await" ? (
            <div>
              <p className="font-semibold">{t("g.awaiting", language)}</p>
              <p className="mt-1 text-sm text-slate-800">Countdown {seconds}s · {guardian.relation} · {guardian.notifyBy}</p>
              <Button senior={seniorMode} className="mt-3" onClick={() => setPhase("choose")}>
                {t("g.simulate", language)}
              </Button>
            </div>
          ) : null}
          {phase === "choose" ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button senior={seniorMode} className="flex-1" onClick={onApprove}>
                {t("g.approve", language)}
              </Button>
              <Button senior={seniorMode} variant="danger" className="flex-1" onClick={onDeny}>
                {t("g.deny", language)}
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
