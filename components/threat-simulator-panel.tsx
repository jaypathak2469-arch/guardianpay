"use client";

import { PhoneOff, ScreenShare, TrendingDown } from "lucide-react";
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
    <section className="rounded-xl border-2 border-dashed border-slate-400 bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-widest text-slate-800">Demo Controls</p>
      <p className={`mt-1 font-semibold text-[var(--gp-ink)] ${seniorMode ? "text-lg" : "text-sm"}`}>
        Simulate Attack Scenario
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button senior={seniorMode} variant="secondary" onClick={() => void start()}>
          <ScreenShare className="h-4 w-4" />
          Screen-share
        </Button>
        <Button senior={seniorMode} variant="ghost" onClick={simulate}>
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
