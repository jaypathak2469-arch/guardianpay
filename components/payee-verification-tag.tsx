"use client";

import { t } from "@/lib/i18n";
import type { Language, TrustLevel } from "@/lib/types";
import { Badge } from "./ui/badge";

const tone: Record<TrustLevel, "green" | "amber" | "red"> = {
  trusted: "green",
  unknown: "amber",
  suspicious: "red",
};

export function PayeeVerificationTag({
  trustLevel,
  language,
  seniorMode,
}: {
  trustLevel: TrustLevel;
  language: Language;
  seniorMode: boolean;
}) {
  const label = t(`payee.${trustLevel}`, language);
  const explain = t(`payee.${trustLevel}.explain`, language);

  if (seniorMode) {
    return (
      <div
        className={`mt-3 rounded-xl border-2 p-4 ${
          trustLevel === "trusted"
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
