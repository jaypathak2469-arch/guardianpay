"use client";

import { useEffect, useState } from "react";
import { Clock, Lock } from "lucide-react";
import { t } from "@/lib/i18n";
import type { CoolingOffLock, Language } from "@/lib/types";
import { Button } from "./ui/button";

function formatRemain(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  return `${h}h ${m}m`;
}

export function CoolingOffBanner({
  lock,
  language,
  seniorMode,
  onNotifyGuardian,
}: {
  lock: CoolingOffLock;
  language: Language;
  seniorMode: boolean;
  onNotifyGuardian: () => void;
}) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="rounded-xl border-2 border-amber-600 bg-amber-50 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <Lock className="mt-0.5 h-6 w-6 shrink-0 text-amber-800" />
        <div className="flex-1">
          <p className={`font-bold text-[var(--gp-ink)] ${seniorMode ? "text-xl" : "text-base"}`}>
            {t("cooling.title", language)}
          </p>
          <p className={`mt-1 flex items-center gap-2 font-semibold text-slate-900 ${seniorMode ? "text-lg" : "text-sm"}`}>
            <Clock className="h-4 w-4" />
            {t("cooling.unlocks", language)} {formatRemain(lock.unlockAt - now)}
          </p>
          <p className={`mt-1 text-slate-900 ${seniorMode ? "text-base" : "text-sm"}`}>
            {t(lock.reasonKey, language)}
          </p>
          <Button senior={seniorMode} variant="amber" className="mt-3" onClick={onNotifyGuardian}>
            {t("cooling.notify", language)}
          </Button>
        </div>
      </div>
    </div>
  );
}
