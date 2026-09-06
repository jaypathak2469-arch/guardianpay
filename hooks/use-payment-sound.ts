"use client";

import { useCallback, useRef } from "react";

type Kind = "success" | "blocked" | "pending";

export function usePaymentSound() {
  const ctxRef = useRef<AudioContext | null>(null);

  const getContext = useCallback(() => {
    if (typeof window === "undefined") return null;
    if (!ctxRef.current) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      ctxRef.current = new Ctor();
    }
    if (ctxRef.current.state === "suspended") {
      void ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  const tone = useCallback(
    (
      ctx: AudioContext,
      freq: number,
      startAt: number,
      duration: number,
      type: OscillatorType,
      peak = 0.18,
    ) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, startAt);
      gain.gain.setValueAtTime(0, startAt);
      gain.gain.linearRampToValueAtTime(peak, startAt + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startAt);
      osc.stop(startAt + duration + 0.05);
    },
    [],
  );

  const play = useCallback(
    (kind: Kind) => {
      const ctx = getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      if (kind === "success") {
        tone(ctx, 660, now, 0.16, "sine");
        tone(ctx, 990, now + 0.12, 0.22, "sine");
      } else if (kind === "pending") {
        tone(ctx, 520, now, 0.28, "sine", 0.14);
      } else {
        tone(ctx, 300, now, 0.18, "square", 0.1);
        tone(ctx, 220, now + 0.14, 0.24, "square", 0.1);
      }
    },
    [getContext, tone],
  );

  return {
    playSuccess: () => play("success"),
    playBlocked: () => play("blocked"),
    playPending: () => play("pending"),
  };
}
