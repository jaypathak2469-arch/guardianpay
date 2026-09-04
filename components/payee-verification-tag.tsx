"use client";

import { ShieldCheck } from "lucide-react";
import { t } from "@/lib/i18n";
import type { Language, TrustLevel } from "@/lib/types";
import { Badge } from "./ui/badge";

const tone: Record<TrustLevel, "green" | "amber" | "red"> = {
  trusted: "green",
  unknown: "amber",
  suspicious: "red",
  verified: "green",
};

export function PayeeVerificationTag({
  trustLevel,
  language,
  seniorMode,
  isGuardian = false,
}: {
  trustLevel: TrustLevel;
  language: Language;
  seniorMode: boolean;
  isGuardian?: boolean;
}) {
  if (isGuardian) {
    const label = "Guardian — Verified Trusted Contact";
    const explain = "This person is in your trusted circle. Transfers to them skip extra verification steps.";

    if (seniorMode) {
      return (
        <div className="mt-3 flex items-start gap-3 rounded-xl border-2 border-[var(--gp-accent)] bg-teal-50 p-4">
          <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-[var(--gp-accent)]" />
          <div>
            <p className="text-lg font-bold text-[var(--gp-ink)]">{label}</p>
            <p className="mt-1 text-base font-medium text-[var(--gp-ink)]">{explain}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full border border-[var(--gp-accent)] bg-teal-50 px-2.5 py-1 text-xs font-bold text-[var(--gp-accent)]">
          <ShieldCheck className="h-3.5 w-3.5" />
          {label}
        </span>
        <span className="text-sm text-slate-800">{explain}</span>
      </div>
    );
  }

  const label = t(`payee.${trustLevel}`, language);
  const explain = t(`payee.${trustLevel}.explain`, language);
  const isPositive = trustLevel === "trusted" || trustLevel === "verified";

  if (seniorMode) {
    return (
      <div
        className={`mt-3 rounded-xl border-2 p-4 ${
          isPositive
            ? "border-emerald-600 bg-emerald-50"
            : trustLevel === "unknown"
              ? "border-amber-600 bg-amber-50"
              : "border-red-700 bg-red-50"
        }`}
      >
        <p className="text-lg font-bold text-[var(--gp-ink)]">{label}</p>
        <p className="mt-1 text-base font-medium text-[var(--gp-ink)]">{explain}</p>
      </div>
    );
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <Badge tone={tone[trustLevel]}>{label}</Badge>
      <span className="text-sm text-slate-800">{explain}</span>
    </div>
  );
}
