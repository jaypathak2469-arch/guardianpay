"use client";

import { useCallback } from "react";
import { speechLang, t } from "@/lib/i18n";
import type { Language } from "@/lib/types";

export function useVoiceAlert(language: Language, enabled: boolean) {
  const speak = useCallback(
    (key: string, opts?: { force?: boolean }) => {
      if ((!enabled && !opts?.force) || typeof window === "undefined" || !window.speechSynthesis) return;
      const text = t(key, language);
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = speechLang(language);
      utterance.rate = 0.92;
      window.speechSynthesis.speak(utterance);
    },
    [enabled, language],
  );

  return { speak };
}
