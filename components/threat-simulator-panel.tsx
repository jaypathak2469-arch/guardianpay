"use client";

import { MonitorPlay, PhoneOff, ScreenShare, TrendingDown } from "lucide-react";
import { useScreenShareDetector } from "@/hooks/use-screen-share-detector";
import type { ThreatScenario } from "@/lib/types";
import { Button } from "./ui/button";

export function ThreatSimulatorPanel({
  seniorMode,
  onTrigger,
}: {
  seniorMode: boolean;
  onTrigger: (scenario: ThreatScenario) => void;
}) {
  const { start, simulate } = useScreenShareDetector(() => onTrigger("screen-share"));

  return (
    <section
      className={
        seniorMode
          ? "rounded-xl border-2 border-dashed border-slate-400 bg-slate-50 p-4"
          : "rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/80 p-4 backdrop-blur-sm dark:border-white/15 dark:bg-white/5 dark:text-white"
      }
    >
      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Demo controls</p>
      <p className={`mt-1 font-semibold text-[var(--gp-ink)] dark:text-white ${seniorMode ? "text-lg" : "text-sm"}`}>
        Simulate attack scenario
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button senior={seniorMode} variant="secondary" onClick={() => void start()}>
          <ScreenShare className="h-4 w-4" />
          Screen-share
        </Button>
        <Button senior={seniorMode} variant="secondary" onClick={simulate}>
          <MonitorPlay className="h-4 w-4" />
          Manual screen-share
        </Button>
        <Button senior={seniorMode} variant="secondary" onClick={() => onTrigger("police-call")}>
          <PhoneOff className="h-4 w-4" />
          Police-coercion call
        </Button>
        <Button senior={seniorMode} variant="secondary" onClick={() => onTrigger("balance-drain")}>
          <TrendingDown className="h-4 w-4" />
          Balance-drain
        </Button>
      </div>
    </section>
  );
}
