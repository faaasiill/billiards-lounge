/**
 * Single source of truth for per-day opening hours.
 * Used by the admin Settings page AND the public booking code.
 */

export type DayHours = {
  weekday: number; // 0=Sun..6=Sat
  is_open: boolean;
  open_time: string; // "HH:MM"
  close_time: string; // "HH:MM"
};

export type ClosureRange = { start_date: string; end_date: string }; // yyyy-mm-dd

export const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/** Display order in the admin UI. */
export const WEEK_ORDER = [0, 1, 2, 3, 4, 5, 6];

export const DEFAULT_HOURS: DayHours[] = Array.from({ length: 7 }, (_, weekday) => ({
  weekday,
  is_open: true,
  open_time: "10:00",
  close_time: "22:00",
}));

/* ---------------------------- time helpers ---------------------------- */

/** "HH:MM" (or "HH:MM:SS") -> minutes from 00:00. */
export const toMinutes = (hm: string): number => {
  const [h, m] = hm.slice(0, 5).split(":").map(Number);
  return h * 60 + m;
};

/** Normalises a Postgres `time` ("10:00:00") to "HH:MM". */
export const toHm = (value: string): string => value.slice(0, 5);

/** "15:00" -> "3:00 PM" */
export const formatHm = (hm: string): string => {
  const [h, m] = hm.slice(0, 5).split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
};

/** Minutes from a day's 00:00 (may exceed 1440) -> "h:mm AM/PM". */
export const formatMinutes = (total: number): string => {
  const m = ((total % 1440) + 1440) % 1440;
  return formatHm(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
};

export const describeHours = (day: DayHours): string =>
  day.is_open ? `${formatHm(day.open_time)} – ${formatHm(day.close_time)}` : "Closed";

/** True when the shop closes after midnight (close <= open). */
export const closesAfterMidnight = (day: DayHours): boolean =>
  day.is_open && toMinutes(day.close_time) <= toMinutes(day.open_time);

/**
 * Bookable window in minutes from that day's 00:00.
 * closeMinutes can exceed 1440 (00:00 as closing time = 1440).
 * Returns null when the day is closed.
 */
export const getDayWindow = (
  day: DayHours,
): { openMinutes: number; closeMinutes: number } | null => {
  if (!day.is_open) return null;
  const openMinutes = toMinutes(day.open_time);
  let closeMinutes = toMinutes(day.close_time);
  if (closeMinutes <= openMinutes) closeMinutes += 1440;
  return { openMinutes, closeMinutes };
};

/* ------------------------- date-based helpers ------------------------- */
/* Dates are "yyyy-mm-dd" strings in the CLUB's calendar, never browser-local. */

export const weekdayOfDate = (dateStr: string): number => {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
};

export const isInClosure = (closures: ClosureRange[], dateStr: string): boolean =>
  closures.some((c) => dateStr >= c.start_date && dateStr <= c.end_date);

export type DateOpenState =
  | { open: true; window: { openMinutes: number; closeMinutes: number } }
  | { open: false; reason: "weekly" | "closure" };

/** Is the shop open on this date, and with what hours? */
export const getDateOpenState = (
  hours: DayHours[],
  closures: ClosureRange[],
  dateStr: string,
): DateOpenState => {
  if (isInClosure(closures, dateStr)) return { open: false, reason: "closure" };
  const day = hours.find((d) => d.weekday === weekdayOfDate(dateStr));
  const window = day ? getDayWindow(day) : null;
  return window ? { open: true, window } : { open: false, reason: "weekly" };
};

/* ------------------------ timezone-aware helpers ----------------------- */

const tzOffsetMinutes = (utcMs: number, timeZone: string): number => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(utcMs));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return (asUtc - utcMs) / 60000;
};

/** Club-local date + minutes-from-midnight -> UTC ISO string. */
export const zonedMinutesToIso = (dateStr: string, minutes: number, timeZone: string): string => {
  const [y, m, d] = dateStr.split("-").map(Number);
  const naive = Date.UTC(y, m - 1, d, 0, minutes);
  let utc = naive - tzOffsetMinutes(naive, timeZone) * 60000;
  utc = naive - tzOffsetMinutes(utc, timeZone) * 60000;
  return new Date(utc).toISOString();
};

/** Today's date (yyyy-mm-dd) in the club's timezone. */
export const todayInZone = (timeZone: string, now: Date = new Date()): string => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return parts; // en-CA => yyyy-mm-dd
};

export type SlotCandidate = {
  startMinutes: number; // from the selected date's 00:00 (may exceed 1440)
  endMinutes: number;
  label: string; // e.g. "3:00 PM"
  startIso: string;
  endIso: string;
};

/**
 * Every possible start time for a session on `dateStr`, based on THAT day's
 * hours. A session must finish by closing time. Slots already in the past
 * (club time) are dropped. Table-conflict filtering stays in availabilityService.
 */
export const buildSlotCandidates = (args: {
  hours: DayHours[];
  closures: ClosureRange[];
  dateStr: string;
  durationMinutes: number;
  slotIntervalMinutes: number;
  timeZone: string;
  now?: Date;
}): SlotCandidate[] => {
  const { hours, closures, dateStr, durationMinutes, slotIntervalMinutes, timeZone } = args;
  const state = getDateOpenState(hours, closures, dateStr);
  if (!state.open || durationMinutes <= 0 || slotIntervalMinutes <= 0) return [];

  const nowMs = (args.now ?? new Date()).getTime();
  const out: SlotCandidate[] = [];

  for (
    let start = state.window.openMinutes;
    start + durationMinutes <= state.window.closeMinutes;
    start += slotIntervalMinutes
  ) {
    const startIso = zonedMinutesToIso(dateStr, start, timeZone);
    if (new Date(startIso).getTime() <= nowMs) continue;
    out.push({
      startMinutes: start,
      endMinutes: start + durationMinutes,
      label: formatMinutes(start),
      startIso,
      endIso: zonedMinutesToIso(dateStr, start + durationMinutes, timeZone),
    });
  }
  return out;
};