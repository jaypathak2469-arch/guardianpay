import type {
  GuardianContact,
  Heuristic,
  Payee,
  Transaction,
} from "./types";

export const MOCK_PAYEES: Payee[] = [
  {
    id: "p1",
    name: "Ananya Sharma",
    upiId: "ananya@okhdfc",
    trustLevel: "trusted",
    firstTime: false,
  },
  {
    id: "p2",
    name: "Ramesh Kirana Store",
    upiId: "rameshstore@upi",
    trustLevel: "trusted",
    firstTime: false,
  },
  {
    id: "p3",
    name: "Unknown UPI — 98XXXX1122",
    upiId: "98xxxx1122@paytm",
    trustLevel: "unknown",
    firstTime: true,
  },
  {
    id: "p4",
    name: "Cyber Cell Recovery Desk",
    upiId: "recovery@yesbank",
    trustLevel: "suspicious",
    firstTime: true,
  },
  {
    id: "p5",
    name: "Meera Iyer",
    upiId: "meera.iyer@oksbi",
    trustLevel: "unknown",
    firstTime: true,
  },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: "tx1",
    payeeId: "p1",
    payeeName: "Ananya Sharma",
    amount: 2400,
    status: "Completed",
    timestamp: "2026-09-01T10:14:00.000Z",
    note: "Family support",
  },
  {
    id: "tx2",
    payeeId: "p2",
    payeeName: "Ramesh Kirana Store",
    amount: 860,
    status: "Completed",
    timestamp: "2026-08-30T16:02:00.000Z",
  },
  {
    id: "tx3",
    payeeId: "p4",
    payeeName: "Cyber Cell Recovery Desk",
    amount: 48000,
    status: "Blocked",
    timestamp: "2026-08-28T09:41:00.000Z",
    note: "Interceptor: police-call",
  },
  {
    id: "tx4",
    payeeId: "p5",
    payeeName: "Meera Iyer",
    amount: 32000,
    status: "Guardian-Approved",
    timestamp: "2026-08-22T12:20:00.000Z",
  },
  {
    id: "tx5",
    payeeId: "p3",
    payeeName: "Unknown UPI — 98XXXX1122",
    amount: 15000,
    status: "Flagged",
    timestamp: "2026-08-18T18:55:00.000Z",
  },
];

export const MOCK_GUARDIANS: GuardianContact[] = [
  {
    id: "g1",
    name: "Priya Pathak",
    relation: "Daughter",
    phone: "+91 98765 44110",
    email: "priya.pathak@email.com",
    notifyBy: "sms",
  },
  {
    id: "g2",
    name: "Arjun Pathak",
    relation: "Son",
    phone: "+91 98200 77821",
    email: "arjun.pathak@email.com",
    notifyBy: "both",
  },
];

export const HEURISTIC_CATALOG: Record<string, Omit<Heuristic, "id" | "timestamp">> = {
  unknownPayee: {
    key: "unknownPayee",
    title: "New or unverified payee",
    explanationKey: "h.unknownPayee",
    weight: 25,
  },
  suspiciousPayee: {
    key: "suspiciousPayee",
    title: "Payee marked suspicious",
    explanationKey: "h.suspiciousPayee",
    weight: 40,
  },
  firstTimeHigh: {
    key: "firstTimeHigh",
    title: "First-time payee + high amount",
    explanationKey: "h.firstTimeHigh",
    weight: 30,
  },
  largeAmount: {
    key: "largeAmount",
    title: "Unusually large amount",
    explanationKey: "h.largeAmount",
    weight: 20,
  },
  screenShare: {
    key: "screenShare",
    title: "Remote screen-share detected",
    explanationKey: "h.screenShare",
    weight: 35,
  },
  policeCall: {
    key: "policeCall",
    title: "Police / digital-arrest language",
    explanationKey: "h.policeCall",
    weight: 40,
  },
  balanceDrain: {
    key: "balanceDrain",
    title: "Sudden balance-drain pattern",
    explanationKey: "h.balanceDrain",
    weight: 30,
  },
  reportedPayee: {
    key: "reportedPayee",
    title: "Payee previously reported for fraud",
    explanationKey: "h.reportedPayee",
    weight: 25,
  },
  scamKeyword: {
    key: "scamKeyword",
    title: "Scam phrases heard on the call",
    explanationKey: "h.scamKeyword",
    weight: 8,
  },
  velocity: {
    key: "velocity",
    title: "Too many large transfers in a short window",
    explanationKey: "h.velocity",
    weight: 20,
  },
};

export interface ScamKeyword {
  phrase: string;
  flagKey: string;
}

export const SCAM_KEYWORDS: ScamKeyword[] = [
  { phrase: "arrest", flagKey: "kw.arrest" },
  { phrase: "digital custody", flagKey: "kw.digitalCustody" },
  { phrase: "otp", flagKey: "kw.otp" },
  { phrase: "rbi verification", flagKey: "kw.rbi" },
  { phrase: "stay on the line", flagKey: "kw.stayOnLine" },
  { phrase: "do not tell anyone", flagKey: "kw.secrecy" },
  { phrase: "safe account", flagKey: "kw.safeAccount" },
  { phrase: "warrant", flagKey: "kw.warrant" },
];

export const MOCK_SCAM_TRANSCRIPT = [
  "This is Inspector Rao from the Cyber Crime Cell. Stay on the line.",
  "A warrant has been issued in your name. You are under digital custody.",
  "Do not tell anyone — not even your family — or we will arrest them too.",
  "For RBI verification you must transfer funds to a government safe account.",
  "Share the OTP that arrives on your phone so we can freeze the fraud.",
  "If you disconnect, the arrest will proceed immediately.",
];

export function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}
