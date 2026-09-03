import { ReactNode } from "react";

type Tone = "green" | "amber" | "red" | "slate" | "blue";

const tones: Record<Tone, string> = {
  green: "bg-emerald-100 text-emerald-950 border-emerald-400",
  amber: "bg-amber-100 text-amber-950 border-amber-400",
  red: "bg-red-100 text-red-950 border-red-400",
  slate: "bg-slate-100 text-slate-900 border-slate-300",
  blue: "bg-sky-100 text-sky-950 border-sky-400",
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
