"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MOCK_SCAM_TRANSCRIPT } from "@/lib/mock-data";

interface SpeechRecCtor {
  new (): SpeechRecognitionLike;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((ev: { results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

function getCtor(): SpeechRecCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecCtor;
    webkitSpeechRecognition?: SpeechRecCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useSpeechRecognition(active: boolean, lang: string) {
  const [lines, setLines] = useState<string[]>([]);
  const [source, setSource] = useState<"live" | "mock">("mock");
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const timerRef = useRef<number | null>(null);

  const stopMock = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const playMock = useCallback(() => {
    setSource("mock");
    setLines([]);
    let i = 0;
    timerRef.current = window.setInterval(() => {
      setLines((prev) => [...prev, MOCK_SCAM_TRANSCRIPT[i]]);
      i += 1;
      if (i >= MOCK_SCAM_TRANSCRIPT.length && timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }, 2200);
  }, []);

  useEffect(() => {
    if (!active) {
      recRef.current?.stop();
      stopMock();
      setLines([]);
      return;
    }

    const Ctor = getCtor();
    if (!Ctor) {
      playMock();
      return () => stopMock();
    }

    let usedLive = false;
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = lang;
    rec.onresult = (ev) => {
      const last = ev.results[ev.results.length - 1];
      if (last?.isFinal) {
        usedLive = true;
        setSource("live");
        setLines((prev) => [...prev, last[0].transcript]);
      }
    };
    rec.onerror = () => {
      if (!usedLive) playMock();
    };
    rec.onend = () => {
      if (!usedLive) playMock();
    };
    recRef.current = rec;
    try {
      rec.start();
      const fallback = window.setTimeout(() => {
        if (!usedLive) {
          rec.stop();
          playMock();
        }
      }, 2500);
      return () => {
        window.clearTimeout(fallback);
        rec.stop();
        stopMock();
      };
    } catch {
      playMock();
      return () => stopMock();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restart only when the interceptor opens
  }, [active, playMock]);

  return { lines, source };
}
