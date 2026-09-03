export type Language = "en" | "hi" | "ta";

export type TrustLevel = "trusted" | "unknown" | "suspicious";

export type TransactionStatus =
  | "Completed"
  | "Blocked"
  | "Guardian-Approved"
  | "Flagged"
  | "Locked"
  | "Reported"
  | "Pending";

export type ThreatScenario = "screen-share" | "police-call" | "balance-drain";

export type NotifyPreference = "sms" | "email" | "both";

export type Tab = "home" | "transfer" | "console" | "history" | "guardians";

export type LogKind =
  | "threat"
  | "risk"
  | "guardian"
  | "transaction"
  | "fraud"
  | "info";

export interface Payee {
  id: string;
  name: string;
  upiId: string;
  trustLevel: TrustLevel;
  firstTime: boolean;
}

export interface Transaction {
  id: string;
  payeeId: string;
  payeeName: string;
  amount: number;
  status: TransactionStatus;
  timestamp: string;
  note?: string;
}

export interface Heuristic {
  id: string;
  key: string;
  title: string;
  explanationKey: string;
  weight: number;
  timestamp: string;
}

export interface GuardianContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
  email: string;
  notifyBy: NotifyPreference;
}

export interface CoolingOffLock {
  transactionId: string;
  unlockAt: number;
  reasonKey: string;
  payeeId: string;
  amount: number;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  kind: LogKind;
}

export interface RiskInput {
  amount: number;
  payeeTrust: TrustLevel;
  firstTimePayee: boolean;
  activeThreatFlags: ThreatScenario[];
  reportedPayee: boolean;
  recentLargeTransferCount: number;
  scamKeywordHits: number;
}

export interface RiskResult {
  score: number;
  triggeredHeuristics: Heuristic[];
}

export interface CoolingOffConfig {
  firstTimeAmountThreshold: number;
  lockMs: number;
  guardianAmountThreshold: number;
  guardianScoreThreshold: number;
}

export const COOLING_OFF_CONFIG: CoolingOffConfig = {
  firstTimeAmountThreshold: 25000,
  lockMs: 24 * 60 * 60 * 1000,
  guardianAmountThreshold: 25000,
  guardianScoreThreshold: 70,
};
