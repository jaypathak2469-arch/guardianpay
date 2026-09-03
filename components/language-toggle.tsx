"use client";

import { Languages } from "lucide-react";
import type { Language } from "@/lib/types";

const labels: { id: Language; label: string }[] = [
  { id: "en", label: "EN" },
  { id: "hi", label: "हिंदी" },
  { id: "ta", label: "தமிழ்" },
];

export function LanguageToggle({
  language,
  onChange,
  seniorMode,
}: {
  language: Language;
  onChange: (lang: Language) => void;
  seniorMode: boolean;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-xl border-2 border-slate-300 bg-white p-1">
      <Languages className="ml-2 h-4 w-4 text-[var(--gp-accent)]" />
      {labels.map((l) => (
        <button
          key={l.id}
          type="button"
          onClick={() => onChange(l.id)}
          className={`rounded-lg px-3 font-bold ${seniorMode ? "min-h-12 text-base" : "min-h-9 text-sm"} ${
            language === l.id
              ? "bg-[var(--gp-accent)] text-white"
              : "text-[var(--gp-ink)] hover:bg-slate-100"
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
