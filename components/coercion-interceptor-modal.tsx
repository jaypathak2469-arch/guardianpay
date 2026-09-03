"use client";

import { useState } from "react";
import { PhoneOff, ScreenShare, TrendingDown } from "lucide-react";
import { t } from "@/lib/i18n";
import type { Language, ThreatScenario } from "@/lib/types";
import { ScamCallAnalyzer } from "./scam-call-analyzer";
import { Button } from "./ui/button";

const copy: Record<ThreatScenario, { title: string; body: string; primary: string; secondary: string; icon: typeof ScreenShare }> = {
  "screen-share": {
    title: "int.ss.title",
    body: "int.ss.body",
    primary: "int.ss.primary",
    secondary: "int.ss.secondary",
    icon: ScreenShare,
  },
  "police-call": {
    title: "int.pc.title",
    body: "int.pc.body",
    primary: "int.pc.primary",
    secondary: "int.pc.secondary",
    icon: PhoneOff,
  },
  "balance-drain": {
    title: "int.bd.title",
    body: "int.bd.body",
    primary: "int.bd.primary",
    secondary: "int.bd.secondary",
    icon: TrendingDown,
  },
};

export function CoercionInterceptorModal({
  scenario,
  language,
  seniorMode,
  onPrimary,
  onSecondary,
  onKeywordHits,
}: {
  scenario: ThreatScenario;
  language: Language;
  seniorMode: boolean;
  onPrimary: () => void;
  onSecondary: () => void;
  onKeywordHits: (phrases: string[]) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const cfg = copy[scenario];
  const Icon = cfg.icon;

  const handleSecondary = () => {
    if (scenario === "police-call" && !confirming) {
      setConfirming(true);
      return;
    }
    onSecondary();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border-2 border-red-800 bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start gap-3">
          <Icon className="h-8 w-8 shrink-0 text-red-700" />
          <div>
            <h2 className={`font-bold text-[var(--gp-ink)] ${seniorMode ? "text-2xl" : "text-xl"}`}>
              {t(cfg.title, language)}
            </h2>
            <p className={`mt-2 font-medium text-slate-900 ${seniorMode ? "text-lg" : "text-sm"}`}>
              {t(cfg.body, language)}
            </p>
          </div>
        </div>
        {scenario === "police-call" ? (
          <ScamCallAnalyzer language={language} onMatches={onKeywordHits} />
        ) : null}
        {confirming ? (
          <p className="mt-4 rounded-xl border-2 border-red-700 bg-red-50 p-3 font-semibold text-red-950">
            {t("int.pc.confirm", language)}
          </p>
        ) : null}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button senior={seniorMode} variant="danger" className="flex-1" onClick={onPrimary}>
            {t(cfg.primary, language)}
          </Button>
          <Button senior={seniorMode} variant="secondary" className="flex-1" onClick={handleSecondary}>
            {t(cfg.secondary, language)}
          </Button>
        </div>
      </div>
    </div>
  );
}
