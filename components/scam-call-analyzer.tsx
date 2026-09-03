"use client";

import { useEffect, useMemo } from "react";
import { speechLang, t } from "@/lib/i18n";
import { SCAM_KEYWORDS } from "@/lib/mock-data";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import type { Language } from "@/lib/types";

function highlight(line: string, language: Language) {
  const lower = line.toLowerCase();
  const hits = SCAM_KEYWORDS.filter((k) => lower.includes(k.phrase)).sort(
    (a, b) => b.phrase.length - a.phrase.length,
  );
  if (!hits.length) return { nodes: [line], matched: [] as string[] };

  const parts: Array<{ text: string; flag?: string }> = [{ text: line }];
  for (const hit of hits) {
    const next: typeof parts = [];
    for (const part of parts) {
      if (part.flag) {
        next.push(part);
        continue;
      }
      const rx = new RegExp(`(${hit.phrase})`, "ig");
      const chunks = part.text.split(rx);
      chunks.forEach((chunk) => {
        if (chunk.toLowerCase() === hit.phrase) next.push({ text: chunk, flag: hit.flagKey });
        else if (chunk) next.push({ text: chunk });
      });
    }
    parts.splice(0, parts.length, ...next);
  }
  return {
    matched: hits.map((h) => h.phrase),
    nodes: parts.map((p, i) =>
      p.flag ? (
        <span key={i} className="group relative cursor-help rounded bg-red-200 font-semibold text-red-900">
          {p.text}
          <span className="pointer-events-none absolute bottom-full left-0 z-10 mb-1 hidden w-64 rounded-lg border border-red-700 bg-white p-2 text-left text-xs font-medium text-[var(--gp-ink)] shadow-lg group-hover:block">
            {t(p.flag, language)}
          </span>
        </span>
      ) : (
        <span key={i}>{p.text}</span>
      ),
    ),
  };
}

export function ScamCallAnalyzer({
  language,
  onMatches,
}: {
  language: Language;
  onMatches: (phrases: string[]) => void;
}) {
  const { lines, source } = useSpeechRecognition(true, speechLang(language));
  const analyzed = useMemo(() => lines.map((line) => ({ line, ...highlight(line, language) })), [lines, language]);

  useEffect(() => {
    const all = analyzed.flatMap((a) => a.matched);
    onMatches([...new Set(all)]);
    // Parent callback identity is stable; lines are the real trigger.
  }, [analyzed, onMatches]);

  return (
    <div className="mt-4 rounded-xl border-2 border-red-700 bg-white p-3">
      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wide text-slate-800">
        <span>Live transcript analyzer</span>
        <span>{source === "live" ? "Microphone" : "Demo playback"}</span>
      </div>
      <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto text-sm text-[var(--gp-ink)]">
        {analyzed.length === 0 ? (
          <li className="text-slate-700">Listening… if the mic is blocked, a sample scam call will play automatically.</li>
        ) : (
          analyzed.map((a, i) => (
            <li key={i} className="rounded-lg bg-slate-50 p-2 leading-relaxed">
              {a.nodes}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
