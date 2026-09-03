"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  History,
  LayoutDashboard,
  Send,
  Shield,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useVoiceAlert } from "@/hooks/use-voice-alert";
import { t } from "@/lib/i18n";
import { MOCK_GUARDIANS, MOCK_PAYEES, MOCK_TRANSACTIONS, formatInr, uid } from "@/lib/mock-data";
import {
  computeRiskScore,
  needsGuardianApproval,
  shouldLockFirstTimePayee,
} from "@/lib/risk-engine";
import { COOLING_OFF_CONFIG } from "@/lib/types";
import type {
  CoolingOffLock,
  GuardianContact,
  Heuristic,
  Language,
  LogEntry,
  Payee,
  Tab,
  ThreatScenario,
  Transaction,
} from "@/lib/types";
import { CoercionInterceptorModal } from "./coercion-interceptor-modal";
import { GuardianApprovalModal } from "./guardian-approval-modal";
import { GuardianCircleManager } from "./guardian-circle-manager";
import { LanguageToggle } from "./language-toggle";
import { SecurityConsole } from "./security-console";
import { ThreatSimulatorPanel } from "./threat-simulator-panel";
import { TransactionHistory } from "./transaction-history";
import { TransferFlow } from "./transfer-flow";
import { Button } from "./ui/button";
import { StatCard } from "./ui/stat-card";

const TABS: { id: Tab; icon: typeof Send }[] = [
  { id: "home", icon: LayoutDashboard },
  { id: "transfer", icon: Send },
  { id: "console", icon: Shield },
  { id: "history", icon: History },
  { id: "guardians", icon: Users },
];

const VOICE: Record<ThreatScenario, string> = {
  "screen-share": "voice.ss",
  "police-call": "voice.pc",
  "balance-drain": "voice.bd",
};

export function GuardianDashboard() {
  const [seniorMode, setSeniorMode] = useState(false);
  const [language, setLanguage] = useState<Language>("en");
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [riskScore, setRiskScore] = useState(6);
  const [triggeredHeuristics, setTriggeredHeuristics] = useState<Heuristic[]>([]);
  const [activeThreatModal, setActiveThreatModal] = useState<ThreatScenario | null>(null);
  const [guardianModalOpen, setGuardianModalOpen] = useState(false);
  const [coolingOffLocks, setCoolingOffLocks] = useState<CoolingOffLock[]>([]);
  const [guardians, setGuardians] = useState<GuardianContact[]>(MOCK_GUARDIANS);
  const [payees, setPayees] = useState<Payee[]>(MOCK_PAYEES);
  const [eventLog, setEventLog] = useState<LogEntry[]>([
    { id: "log-0", timestamp: new Date().toISOString(), message: "GuardianPay session started", kind: "info" },
  ]);
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [activeThreats, setActiveThreats] = useState<ThreatScenario[]>([]);
  const [keywordHits, setKeywordHits] = useState<string[]>([]);
  const [pending, setPending] = useState<{ payee: Payee; amount: number; unlock?: CoolingOffLock } | null>(null);

  const { speak } = useVoiceAlert(language, seniorMode);
  const guardian = guardians[0];
  const addLog = useCallback((message: string, kind: LogEntry["kind"]) => {
    setEventLog((prev) => [{ id: uid("log"), timestamp: new Date().toISOString(), message, kind }, ...prev]);
  }, []);

  const recalc = useCallback(
    (
      payee: Payee | undefined,
      amount: number,
      threats: ThreatScenario[],
      hits: number,
      silent = false,
    ) => {
      const recentLarge = transactions.filter((tx) => tx.amount > 20000 && tx.status !== "Blocked").length;
      const result = computeRiskScore({
        amount,
        payeeTrust: payee?.trustLevel ?? "trusted",
        firstTimePayee: Boolean(payee?.firstTime),
        activeThreatFlags: threats,
        reportedPayee: payee?.trustLevel === "suspicious",
        recentLargeTransferCount: recentLarge,
        scamKeywordHits: hits,
      });
      setRiskScore((prev) => (prev === result.score ? prev : result.score));
      setTriggeredHeuristics((prev) => {
        const seen = new Set(prev.map((h) => h.key));
        let added = false;
        const merged = [...prev];
        for (const h of result.triggeredHeuristics) {
          if (!seen.has(h.key)) {
            merged.unshift(h);
            seen.add(h.key);
            added = true;
          }
        }
        return added ? merged : prev;
      });
      if (!silent) addLog(`Risk score updated to ${result.score}%`, "risk");
      return result;
    },
    [transactions, addLog],
  );

  const onKeywordHits = useCallback((phrases: string[]) => {
    setKeywordHits((prev) => (phrases.length <= prev.length ? prev : phrases));
  }, []);

  const prevHits = useRef(0);
  useEffect(() => {
    if (keywordHits.length <= prevHits.current) return;
    prevHits.current = keywordHits.length;
    recalc(payees.find((p) => p.firstTime), 30000, activeThreats, keywordHits.length);
  }, [keywordHits, payees, activeThreats, recalc]);

  const onThreat = (scenario: ThreatScenario) => {
    const threats = activeThreats.includes(scenario) ? activeThreats : [...activeThreats, scenario];
    setActiveThreats(threats);
    setActiveThreatModal(scenario);
    recalc(payees.find((p) => p.trustLevel !== "trusted"), 30000, threats, keywordHits.length);
    addLog(`Interceptor shown: ${scenario}`, "threat");
    speak(VOICE[scenario], { force: true });
  };

  const completeTx = (payee: Payee, amount: number, status: Transaction["status"], note?: string) => {
    setTransactions((prev) => [
      { id: uid("tx"), payeeId: payee.id, payeeName: payee.name, amount, status, timestamp: new Date().toISOString(), note },
      ...prev,
    ]);
    if (status === "Completed" || status === "Guardian-Approved") {
      setPayees((prev) => prev.map((p) => (p.id === payee.id ? { ...p, firstTime: false } : p)));
    }
    addLog(`${status}: ${formatInr(amount)} to ${payee.name}`, "transaction");
  };

  const onSubmit = (payee: Payee, amount: number) => {
    const result = recalc(payee, amount, activeThreats, keywordHits.length);
    if (shouldLockFirstTimePayee(amount, payee.firstTime)) {
      const txId = uid("tx");
      const lock: CoolingOffLock = {
        transactionId: txId,
        unlockAt: Date.now() + COOLING_OFF_CONFIG.lockMs,
        reasonKey: "cooling.reason.firstTime",
        payeeId: payee.id,
        amount,
      };
      setCoolingOffLocks((prev) => [...prev, lock]);
      setTransactions((prev) => [
        { id: txId, payeeId: payee.id, payeeName: payee.name, amount, status: "Locked", timestamp: new Date().toISOString(), note: "Cooling-off" },
        ...prev,
      ]);
      addLog(`Locked 24h: first-time payee ${payee.name}`, "transaction");
      speak("voice.lock", { force: true });
      return;
    }
    if (needsGuardianApproval(result.score, amount, payee.trustLevel)) {
      setPending({ payee, amount });
      setGuardianModalOpen(true);
      addLog(`Guardian notified for ${payee.name}`, "guardian");
      speak("voice.highRisk", { force: true });
      return;
    }
    completeTx(payee, amount, "Completed");
  };

  const onUnlock = (lock: CoolingOffLock) => {
    const payee = payees.find((p) => p.id === lock.payeeId) ?? payees[0];
    setPending({ payee, amount: lock.amount, unlock: lock });
    setGuardianModalOpen(true);
    addLog("Early unlock requested — notifying guardian", "guardian");
  };

  const reasons = useMemo(
    () => triggeredHeuristics.slice(0, 4).map((h) => t(h.explanationKey, language)),
    [triggeredHeuristics, language],
  );

  return (
    <div className={seniorMode ? "senior-mode min-h-screen bg-white text-[var(--gp-ink)]" : "min-h-screen bg-slate-50 text-[var(--gp-ink)]"}>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-8 w-8 text-[var(--gp-accent)]" />
            <div>
              <p className="text-xl font-bold">GuardianPay</p>
              <p className="text-xs font-semibold text-slate-800">Protecting vulnerable customers from digital fraud</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button senior={seniorMode} variant={seniorMode ? "primary" : "secondary"} onClick={() => setSeniorMode((v) => !v)}>
              {t(seniorMode ? "mode.senior" : "mode.standard", language)}
            </Button>
            <LanguageToggle language={language} onChange={setLanguage} seniorMode={seniorMode} />
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-3">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 font-semibold ${seniorMode ? "min-h-16" : "min-h-10"} ${
                activeTab === tab.id ? "bg-[var(--gp-accent)] text-white" : "bg-slate-100 text-slate-900"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {t(`tab.${tab.id}`, language)}
            </button>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        {activeTab === "home" || activeTab === "transfer" ? (
          <ThreatSimulatorPanel seniorMode={seniorMode} onTrigger={onThreat} />
        ) : null}
        {activeTab === "home" ? (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <StatCard label="Live risk" value={`${riskScore}%`} hint="From explainable rules" icon={<Shield className="h-6 w-6" />} />
              <StatCard label="Guardians" value={String(guardians.length)} hint={guardian?.name} icon={<Users className="h-6 w-6" />} />
              <StatCard label="Locks" value={String(coolingOffLocks.length)} hint="24h cooling-off" />
            </div>
          </>
        ) : null}
        {activeTab === "transfer" ? (
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h1 className={`mb-4 font-bold ${seniorMode ? "text-3xl" : "text-2xl"}`}>Send money</h1>
            <TransferFlow
              seniorMode={seniorMode}
              language={language}
              payees={payees}
              coolingOffLocks={coolingOffLocks}
              onSubmit={onSubmit}
              onUnlockRequest={onUnlock}
              onDraftChange={(payee, amount) =>
                recalc(payee, amount, activeThreats, keywordHits.length, true)
              }
            />
          </div>
        ) : null}
        {activeTab === "console" ? (
          <SecurityConsole riskScore={riskScore} heuristics={triggeredHeuristics} eventLog={eventLog} language={language} seniorMode={seniorMode} />
        ) : null}
        {activeTab === "history" ? (
          <TransactionHistory
            transactions={transactions}
            locks={coolingOffLocks}
            language={language}
            seniorMode={seniorMode}
            onUnlockRequest={onUnlock}
            onReport={(tx) => {
              setTransactions((prev) => prev.map((row) => (row.id === tx.id ? { ...row, status: "Reported" } : row)));
              setPayees((prev) => prev.map((p) => (p.id === tx.payeeId ? { ...p, trustLevel: "suspicious" } : p)));
              const payee = payees.find((p) => p.id === tx.payeeId);
              if (payee) recalc({ ...payee, trustLevel: "suspicious" }, tx.amount, activeThreats, keywordHits.length);
              addLog(`Fraud report filed for ${tx.payeeName}`, "fraud");
            }}
          />
        ) : null}
        {activeTab === "guardians" ? (
          <GuardianCircleManager guardians={guardians} language={language} seniorMode={seniorMode} onChange={setGuardians} />
        ) : null}
      </main>
      {activeThreatModal ? (
        <CoercionInterceptorModal
          scenario={activeThreatModal}
          language={language}
          seniorMode={seniorMode}
          onKeywordHits={onKeywordHits}
          onPrimary={() => {
            if (activeThreatModal === "balance-drain") {
              setCoolingOffLocks((prev) => [
                ...prev,
                { transactionId: uid("lock"), unlockAt: Date.now() + COOLING_OFF_CONFIG.lockMs, reasonKey: "int.bd.title", payeeId: "*", amount: 0 },
              ]);
              addLog("Further transfers frozen for 24h", "threat");
            }
            if (activeThreatModal === "police-call") addLog("Transfer blocked from coercion interceptor", "transaction");
            setActiveThreatModal(null);
          }}
          onSecondary={() => setActiveThreatModal(null)}
        />
      ) : null}
      {guardianModalOpen && pending && guardian ? (
        <GuardianApprovalModal
          language={language}
          seniorMode={seniorMode}
          guardian={guardian}
          payee={pending.payee}
          amount={pending.amount}
          reasons={reasons}
          earlyUnlock={Boolean(pending.unlock)}
          onApprove={() => {
            if (pending.unlock) {
              setCoolingOffLocks((prev) => prev.filter((l) => l.transactionId !== pending.unlock?.transactionId));
              setTransactions((prev) =>
                prev.map((tx) =>
                  tx.id === pending.unlock?.transactionId ? { ...tx, status: "Guardian-Approved", note: t("g.unlock", language) } : tx,
                ),
              );
              addLog(t("g.unlock", language), "guardian");
            } else {
              completeTx(pending.payee, pending.amount, "Guardian-Approved");
            }
            setGuardianModalOpen(false);
            setPending(null);
          }}
          onDeny={() => {
            if (!pending.unlock) completeTx(pending.payee, pending.amount, "Blocked", "Guardian denied");
            else addLog("Guardian denied early unlock", "guardian");
            setGuardianModalOpen(false);
            setPending(null);
          }}
        />
      ) : null}
    </div>
  );
}
