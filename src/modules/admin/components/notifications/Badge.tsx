import type { ReactNode } from "react";

export type BadgeTone = "ok" | "warn" | "bad" | "muted";

const TONES: Record<BadgeTone, string> = {
  ok: "bg-emerald-100 text-emerald-700",
  warn: "bg-amber-100 text-amber-800",
  bad: "bg-red-100 text-red-700",
  muted: "bg-neutral-100 text-neutral-500",
};

const Badge = ({ tone, children }: { tone: BadgeTone; children: ReactNode }) => (
  <span
    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${TONES[tone]}`}
  >
    {children}
  </span>
);

export default Badge;