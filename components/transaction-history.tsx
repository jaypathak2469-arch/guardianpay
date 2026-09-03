"use client";

import { Flag } from "lucide-react";
import { t } from "@/lib/i18n";
import { formatInr } from "@/lib/mock-data";
import type { CoolingOffLock, Language, Transaction, TransactionStatus } from "@/lib/types";
import { CoolingOffBanner } from "./cooling-off-banner";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

const tone: Record<TransactionStatus, "green" | "red" | "amber" | "blue" | "slate"> = {
  Completed: "green",
  Blocked: "red",
  "Guardian-Approved": "blue",
  Flagged: "amber",
  Locked: "amber",
  Reported: "red",
  Pending: "slate",
};

export function TransactionHistory({
  transactions,
  locks,
  language,
  seniorMode,
  onReport,
  onUnlockRequest,
}: {
  transactions: Transaction[];
  locks: CoolingOffLock[];
  language: Language;
  seniorMode: boolean;
  onReport: (tx: Transaction) => void;
  onUnlockRequest: (lock: CoolingOffLock) => void;
}) {
  const activeLocks = locks.filter((l) => l.unlockAt > Date.now());

  return (
    <div className="space-y-4">
      {activeLocks.map((lock) => (
        <CoolingOffBanner
          key={lock.transactionId}
          lock={lock}
          language={language}
          seniorMode={seniorMode}
          onNotifyGuardian={() => onUnlockRequest(lock)}
        />
      ))}
      <ul className="space-y-3">
        {transactions.map((tx) => (
          <li key={tx.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className={`font-bold text-[var(--gp-ink)] ${seniorMode ? "text-xl" : "text-base"}`}>{tx.payeeName}</p>
                <p className="text-sm font-medium text-slate-800">
                  {new Date(tx.timestamp).toLocaleString("en-IN")}
                  {tx.note ? ` · ${tx.note}` : ""}
                </p>
              </div>
              <div className="text-right">
                <p className={`font-bold ${seniorMode ? "text-xl" : "text-lg"}`}>{formatInr(tx.amount)}</p>
                <Badge tone={tone[tx.status]} large={seniorMode}>
                  {tx.status}
                </Badge>
              </div>
            </div>
            {tx.status === "Completed" ? (
              <div className="mt-3">
                <Button senior={seniorMode} variant="ghost" onClick={() => onReport(tx)}>
                  <Flag className="h-4 w-4" />
                  {t("report.action", language)}
                </Button>
                <p className="mt-1 text-sm font-medium text-slate-800">{t("report.note", language)}</p>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
