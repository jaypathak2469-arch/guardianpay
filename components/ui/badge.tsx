import { ReactNode } from "react";

type Tone = "green" | "amber" | "red" | "slate" | "blue";

const tones: Record<Tone, string> = {
  green: "bg-emerald-100 text-emerald-950 border-emerald-400 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-700",
  amber: "bg-amber-100 text-amber-950 border-amber-400 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-700",
  red: "bg-red-100 text-red-950 border-red-400 dark:bg-red-900/30 dark:text-red-200 dark:border-red-700",
  slate: "bg-slate-100 text-slate-900 border-slate-300 dark:bg-white/10 dark:text-slate-200 dark:border-white/20",
  blue: "bg-sky-100 text-sky-950 border-sky-400 dark:bg-sky-900/30 dark:text-sky-200 dark:border-sky-700",
};

export function Badge({
  tone = "slate",
  large = false,
  children,
}: {
  tone?: Tone;
  large?: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-semibold ${
        large ? "px-3 py-1.5 text-base" : "px-2.5 py-0.5 text-xs"
      } ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
