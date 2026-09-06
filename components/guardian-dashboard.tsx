"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  History,
  LayoutDashboard,
  Moon,
  Send,
  Shield,
  ShieldCheck,
  Sun,
  Users,
} from "lucide-react";
import { useVoiceAlert } from "@/hooks/use-voice-alert";
import { t } from "@/lib/i18n";
import {
  MOCK_GUARDIANS,
  MOCK_PAYEES,
  MOCK_TRANSACTIONS,
  formatInr,
  syncGuardianPayees,
  uid,
} from "@/lib/mock-data";
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

const DEMO_FALLBACK_AMOUNT = 30000;

function riskTextColor(score: number) {
  if (score >= 70) return "text-[var(--gp-danger)]";
  if (score >= 40) return "text-[var(--gp-warn)]";
  return "text-[var(--gp-ok)]";
}

export function GuardianDashboard() {
  const [seniorMode, setSeniorMode] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
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

  const [draftContext, setDraftContext] = useState<{ payee?: Payee; amount: number }>({
    payee: undefined,
    amount: 0,
  });

  const { speak } = useVoiceAlert(language, seniorMode);
  const guardian = guardians[0];
  const addLog = useCallback((message: string, kind: LogEntry["kind"]) => {
    setEventLog((prev) => [{ id: uid("log"), timestamp: new Date().toISOString(), message, kind }, ...prev]);
  }, []);

  useEffect(() => {
    setPayees((prev) => syncGuardianPayees(prev, guardians));
  }, [guardians]);

  const hasTransactionHistory = useCallback(
    (payeeId: string) => transactions.some((tx) => tx.payeeId === payeeId),
    [transactions],
  );

  const onGuardianRemoved = useCallback(
    (payeeId: string, keepAsPayee: boolean) => {
      setPayees((prev) =>
        keepAsPayee
          ? prev.map((p) =>
              p.id === payeeId ? { ...p, isGuardian: false, guardianId: undefined, trustLevel: "trusted" } : p,
            )
          : prev.filter((p) => p.id !== payeeId),
      );
      addLog(
        keepAsPayee
          ? "Guardian removed — payee kept, transaction history preserved"
          : "Guardian and linked payee removed (no transaction history)",
        "guardian",
      );
    },
    [addLog],
  );

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

      if (result.score !== riskScore) {
        const previousScore = riskScore;
        setRiskScore(result.score);
        if (!silent) {
          const topHeuristic = [...result.triggeredHeuristics].sort((a, b) => b.weight - a.weight)[0];
          const cause = topHeuristic ? ` — driven by "${topHeuristic.title}"` : "";
          addLog(`Risk score changed ${previousScore}% → ${result.score}%${cause}`, "risk");
        }
      }

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

      return result;
    },
    [transactions, addLog, riskScore],
  );

  const onDraftChange = useCallback(
    (payee: Payee, amount: number) => {
      setDraftContext({ payee, amount });
      recalc(payee, amount, activeThreats, keywordHits.length, true);
    },
    [recalc, activeThreats, keywordHits],
  );

  const onKeywordHits = useCallback((phrases: string[]) => {
    setKeywordHits((prev) => (phrases.length <= prev.length ? prev : phrases));
  }, []);

  const prevHits = useRef(0);
  useEffect(() => {
    if (keywordHits.length <= prevHits.current) return;
    prevHits.current = keywordHits.length;
    const contextPayee = draftContext.payee ?? payees.find((p) => p.firstTime) ?? payees[0];
    const contextAmount = draftContext.amount > 0 ? draftContext.amount : DEMO_FALLBACK_AMOUNT;
    recalc(contextPayee, contextAmount, activeThreats, keywordHits.length);
  }, [keywordHits, payees, activeThreats, recalc, draftContext]);

  const onThreat = (scenario: ThreatScenario) => {
    const threats = activeThreats.includes(scenario) ? activeThreats : [...activeThreats, scenario];
    setActiveThreats(threats);
    setActiveThreatModal(scenario);
    const contextPayee = draftContext.payee ?? payees.find((p) => p.trustLevel !== "trusted") ?? payees[0];
    const contextAmount = draftContext.amount > 0 ? draftContext.amount : DEMO_FALLBACK_AMOUNT;
    recalc(contextPayee, contextAmount, threats, keywordHits.length);
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

  const shellClass = seniorMode
    ? "senior-mode min-h-screen bg-white text-[var(--gp-ink)]"
    : `min-h-screen text-[var(--gp-ink)] dark:text-white transition-colors ${
        darkMode ? "dark bg-[#0B1220]" : "bg-[#F3F7F7]"
      }`;

  return (
    <div className={shellClass}>
      <header
        className={
          seniorMode
            ? "border-b-2 border-slate-300 bg-white"
            : "sticky top-0 z-20 border-b border-white/20 bg-white/70 backdrop-blur-md dark:border-white/10 dark:bg-[#0B1220]/70"
        }
      >
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <span
              className={
                seniorMode
                  ? "flex h-11 w-11 items-center justify-center rounded-full bg-[var(--gp-accent)]"
                  : "flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#0F5C6B] to-[#22D3C4]"
              }
            >
              <ShieldCheck className="h-6 w-6 text-white" />
            </span>
            <div>
              <p className="text-xl font-bold leading-tight">GuardianPay</p>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Protecting vulnerable customers from digital fraud
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!seniorMode ? (
              <button
                type="button"
                onClick={() => setDarkMode((v) => !v)}
                aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-teal-50 text-[var(--gp-accent)] transition-transform hover:scale-[1.05] active:scale-[0.95] dark:bg-teal-900/30 dark:text-teal-200"
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            ) : null}
            <Button senior={seniorMode} variant={seniorMode ? "primary" : "secondary"} onClick={() => setSeniorMode((v) => !v)}>
              {t(seniorMode ? "mode.senior" : "mode.standard", language)}
            </Button>
            <LanguageToggle language={language} onChange={setLanguage} seniorMode={seniorMode} />
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-3">
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 font-semibold transition-all ${
                  seniorMode ? "min-h-16" : "min-h-10"
                } ${
                  active
                    ? seniorMode
                      ? "bg-[var(--gp-accent)] text-white"
                      : "bg-gradient-to-r from-[#0F5C6B] to-[#22D3C4] text-white shadow-sm"
                    : seniorMode
                      ? "bg-slate-100 text-slate-900"
                      : "bg-slate-900/5 text-slate-700 hover:bg-slate-900/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {t(`tab.${tab.id}`, language)}
              </button>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        {activeTab === "home" || activeTab === "transfer" ? (
          <ThreatSimulatorPanel seniorMode={seniorMode} onTrigger={onThreat} />
        ) : null}
        {activeTab === "home" ? (
          <div className="grid gap-4 md:grid-cols-4 md:grid-rows-2">
            <div
              className={
                seniorMode
                  ? "rounded-2xl border-2 border-slate-300 bg-white p-6 md:col-span-2 md:row-span-2"
                  : "relative overflow-hidden rounded-2xl p-[1px] transition-transform hover:scale-[1.01] md:col-span-2 md:row-span-2"
              }
              style={
                seniorMode
                  ? undefined
                  : { backgroundImage: "linear-gradient(135deg, #0F5C6B, #22D3C4)" }
              }
            >
              <div
                className={
                  seniorMode
                    ? ""
                    : "flex h-full flex-col justify-between rounded-2xl bg-white p-6 dark:bg-[#0F1B2A]"
                }
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-50 dark:bg-teal-900/30">
                    <Shield className="h-5 w-5 text-[var(--gp-accent)]" />
                  </span>
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Live risk score</p>
                </div>
                <div className="mt-4">
                  <span className={`text-6xl font-bold tabular-nums ${riskTextColor(riskScore)}`}>{riskScore}</span>
                  <span className={`text-2xl font-bold ${riskTextColor(riskScore)}`}>%</span>
                </div>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  From explainable rules — updates live as you draft a transfer
                </p>
              </div>
            </div>
            <StatCard label="Guardians" value={String(guardians.length)} hint={guardian?.name} icon={<Users className="h-6 w-6" />} />
            <StatCard label="Locks" value={String(coolingOffLocks.length)} hint="24h cooling-off" />
            <div
              className={
                seniorMode
                  ? "rounded-2xl border-2 border-slate-300 bg-white p-5 md:col-span-2"
                  : "rounded-2xl border border-white/40 bg-white/60 p-5 shadow-sm backdrop-blur-sm transition-transform hover:scale-[1.01] dark:border-white/10 dark:bg-white/5 md:col-span-2"
              }
            >
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-50 dark:bg-teal-900/30">
                  <Send className="h-5 w-5 text-[var(--gp-accent)]" />
                </span>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Quick action</p>
              </div>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                Ready to send money? We&apos;ll screen every transfer against your trusted circle in real time.
              </p>
              <Button
                senior={seniorMode}
                className="mt-3"
                onClick={() => setActiveTab("transfer")}
              >
                Go to Send money
              </Button>
            </div>
          </div>
        ) : null}
        {activeTab === "transfer" ? (
          <div
            className={
              seniorMode
                ? "rounded-xl border-2 border-slate-300 bg-white p-5"
                : "rounded-2xl border border-white/40 bg-white/70 p-5 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/5"
            }
          >
            <h1 className={`mb-4 font-bold ${seniorMode ? "text-3xl" : "text-2xl"}`}>Send money</h1>
            <TransferFlow
              seniorMode={seniorMode}
              language={language}
              payees={payees}
              coolingOffLocks={coolingOffLocks}
              riskScore={riskScore}
              onSubmit={onSubmit}
              onUnlockRequest={onUnlock}
              onDraftChange={onDraftChange}
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
          <GuardianCircleManager
            guardians={guardians}
            payees={payees}
            language={language}
            seniorMode={seniorMode}
            onChange={setGuardians}
            hasTransactionHistory={hasTransactionHistory}
            onGuardianRemoved={onGuardianRemoved}
          />
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
