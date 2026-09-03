"use client";

import { useEffect, useMemo, useState } from "react";
import { t } from "@/lib/i18n";
import { formatInr } from "@/lib/mock-data";
import type { CoolingOffLock, Language, Payee } from "@/lib/types";
import { CoolingOffBanner } from "./cooling-off-banner";
import { PayeeVerificationTag } from "./payee-verification-tag";
import { Button } from "./ui/button";

export function TransferFlow({
  seniorMode,
  language,
  payees,
  coolingOffLocks,
  onSubmit,
  onUnlockRequest,
  onDraftChange,
}: {
  seniorMode: boolean;
  language: Language;
  payees: Payee[];
  coolingOffLocks: CoolingOffLock[];
  onSubmit: (payee: Payee, amount: number) => void;
  onUnlockRequest: (lock: CoolingOffLock) => void;
  onDraftChange?: (payee: Payee, amount: number) => void;
}) {
  const [payeeId, setPayeeId] = useState(payees[0]?.id ?? "");
  const [amount, setAmount] = useState("5000");
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const payee = useMemo(
    () => payees.find((p) => p.id === payeeId) ?? payees[0],
    [payeeId, payees],
  );
  const lock = coolingOffLocks.find(
    (l) => l.unlockAt > Date.now() && (l.payeeId === "*" || l.payeeId === payee?.id),
  );
  const parsed = Number(amount.replace(/[^\d]/g, "")) || 0;

  useEffect(() => {
    if (payee) onDraftChange?.(payee, parsed);
  }, [payee, parsed, onDraftChange]);

  const field = "w-full rounded-xl border-2 border-slate-400 bg-white px-3 py-3 text-[var(--gp-ink)]";
  const selectPayee = (
    <label className="block">
      <span className={`font-semibold ${seniorMode ? "text-lg" : "text-sm"}`}>{t("wizard.payee", language)}</span>
      <select
        className={`${field} mt-2 ${seniorMode ? "min-h-16 text-lg" : "min-h-11"}`}
        value={payee?.id}
        onChange={(e) => setPayeeId(e.target.value)}
      >
        {payees.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} · {p.upiId}
          </option>
        ))}
      </select>
      {payee ? (
        <PayeeVerificationTag trustLevel={payee.trustLevel} language={language} seniorMode={seniorMode} />
      ) : null}
    </label>
  );

  const amountField = (
    <label className="block">
      <span className={`font-semibold ${seniorMode ? "text-lg" : "text-sm"}`}>{t("wizard.amount", language)}</span>
      <input
        className={`${field} mt-2 ${seniorMode ? "min-h-16 text-lg" : "min-h-11"}`}
        inputMode="numeric"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
    </label>
  );

  if (seniorMode) {
    return (
      <div className="space-y-6">
        {lock ? (
          <CoolingOffBanner
            lock={lock}
            language={language}
            seniorMode
            onNotifyGuardian={() => onUnlockRequest(lock)}
          />
        ) : null}
        {step === 1 ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">{t("wizard.who", language)}</h2>
            {selectPayee}
            <Button senior className="w-full" onClick={() => setStep(2)}>
              {t("wizard.next", language)}
            </Button>
          </div>
        ) : null}
        {step === 2 ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">{t("wizard.howMuch", language)}</h2>
            {amountField}
            <div className="flex gap-3">
              <Button senior variant="secondary" className="flex-1" onClick={() => setStep(1)}>
                {t("wizard.back", language)}
              </Button>
              <Button senior className="flex-1" onClick={() => setStep(3)}>
                {t("wizard.next", language)}
              </Button>
            </div>
          </div>
        ) : null}
        {step === 3 ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">{t("wizard.confirm", language)}</h2>
            <div className="rounded-xl border-2 border-slate-400 bg-white p-4 text-lg">
              <p>
                <strong>{payee?.name}</strong> · {payee?.upiId}
              </p>
              <p className="mt-2 text-2xl font-bold">{formatInr(parsed)}</p>
            </div>
            {payee ? (
              <PayeeVerificationTag trustLevel={payee.trustLevel} language={language} seniorMode />
            ) : null}
            <div className="flex gap-3">
              <Button senior variant="secondary" className="flex-1" onClick={() => setStep(2)}>
                {t("wizard.back", language)}
              </Button>
              <Button
                senior
                className="flex-1"
                disabled={!payee || parsed <= 0 || Boolean(lock)}
                onClick={() => payee && onSubmit(payee, parsed)}
              >
                {t("wizard.send", language)}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {lock ? (
        <CoolingOffBanner
          lock={lock}
          language={language}
          seniorMode={false}
          onNotifyGuardian={() => onUnlockRequest(lock)}
        />
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        {selectPayee}
        {amountField}
      </div>
      <Button disabled={!payee || parsed <= 0 || Boolean(lock)} onClick={() => payee && onSubmit(payee, parsed)}>
        {t("wizard.send", language)}
      </Button>
    </div>
  );
}
