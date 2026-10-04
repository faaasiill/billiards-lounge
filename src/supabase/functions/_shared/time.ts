export const DEFAULT_TZ = "Asia/Kolkata";

const clean = (s: string) => s.replace(/[\u202f\u00a0]/g, " ");

/** "7:00 PM" in the given timezone. */
export const formatTime = (iso: string, timeZone: string): string =>
  clean(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(iso)),
  );

/** "04 Oct 2026" in the given timezone (built from parts so "Sept" never appears). */
export const formatDate = (iso: string, timeZone: string): string => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("day")} ${get("month")} ${get("year")}`;
};

/** 10 digits -> "+91 98765 43210"; anything else is shown as stored. */
export const formatPhone = (raw: string): string => {
  const digits = raw.replace(/\D/g, "");
  const local = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
  return local.length === 10 ? `+91 ${local.slice(0, 5)} ${local.slice(5)}` : raw;
};

export const humanizeMinutes = (minutes: number): string => {
  const n = Math.max(1, Math.round(minutes));
  if (n < 60) return `${n} minute${n === 1 ? "" : "s"}`;
  const h = Math.floor(n / 60);
  const m = n % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
};