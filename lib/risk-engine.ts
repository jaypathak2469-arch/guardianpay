import { HEURISTIC_CATALOG } from "./mock-data";
import {
  COOLING_OFF_CONFIG,
  type Heuristic,
  type RiskInput,
  type RiskResult,
} from "./types";

function stamp(partial: Omit<Heuristic, "id" | "timestamp">): Heuristic {
  return {
    ...partial,
    id: `h-${partial.key}-${Date.now()}`,
    timestamp: new Date().toISOString(),
  };
}

export function shouldLockFirstTimePayee(amount: number, firstTime: boolean): boolean {
  return firstTime && amount > COOLING_OFF_CONFIG.firstTimeAmountThreshold;
}

export function needsGuardianApproval(
  score: number,
  amount: number,
  payeeTrust: RiskInput["payeeTrust"],
): boolean {
  return (
    score > COOLING_OFF_CONFIG.guardianScoreThreshold ||
    (amount > COOLING_OFF_CONFIG.guardianAmountThreshold && payeeTrust === "unknown")
  );
}

// A guardian-linked payee is vetted by the user themselves, so it gets a small
// flat risk reduction rather than a triggered heuristic (there's nothing "wrong"
// to explain to the user — it's a positive signal, not a warning).
const VERIFIED_PAYEE_DISCOUNT = 4;

export function computeRiskScore(input: RiskInput): RiskResult {
  let score = 6;
  const triggered: Heuristic[] = [];
  const add = (key: keyof typeof HEURISTIC_CATALOG, extraWeight = 0) => {
    const rule = HEURISTIC_CATALOG[key];
    triggered.push(stamp(rule));
    score += rule.weight + extraWeight;
  };

  if (input.payeeTrust === "unknown") add("unknownPayee");
  if (input.payeeTrust === "suspicious") add("suspiciousPayee");
  if (input.payeeTrust === "verified") score = Math.max(0, score - VERIFIED_PAYEE_DISCOUNT);
  if (input.reportedPayee) add("reportedPayee");
  if (input.firstTimePayee && input.amount > COOLING_OFF_CONFIG.firstTimeAmountThreshold) {
    add("firstTimeHigh");
  }
  if (input.amount > 50000) add("largeAmount");
  if (input.activeThreatFlags.includes("screen-share")) add("screenShare");
  if (input.activeThreatFlags.includes("police-call")) add("policeCall");
  if (input.activeThreatFlags.includes("balance-drain")) add("balanceDrain");
  if (input.recentLargeTransferCount >= 3) add("velocity");
  if (input.scamKeywordHits > 0) {
    add("scamKeyword", Math.min(input.scamKeywordHits * 8, 32) - HEURISTIC_CATALOG.scamKeyword.weight);
  }

  return { score: Math.max(0, Math.min(100, Math.round(score))), triggeredHeuristics: triggered };
}
