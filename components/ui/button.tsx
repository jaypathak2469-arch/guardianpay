import { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost" | "amber";

const styles: Record<Variant, string> = {
  primary:
    "bg-[var(--gp-accent)] text-white hover:bg-[var(--gp-accent-dark)] focus-visible:ring-[var(--gp-accent)]",
  secondary:
    "bg-white text-[var(--gp-ink)] border-2 border-slate-300 hover:bg-slate-50",
  danger: "bg-[var(--gp-danger)] text-white hover:bg-red-800",
  amber: "bg-[var(--gp-warn)] text-slate-950 hover:bg-amber-500",
  ghost: "bg-transparent text-[var(--gp-ink)] hover:bg-slate-100",
};

export function Button({
  variant = "primary",
  senior = false,
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  senior?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 font-semibold transition focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-50 ${
        senior ? "min-h-16 text-lg px-6" : "min-h-11 text-sm"
      } ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
