import type { DateOption } from "./types";

/** Flat surcharge applied to peak-hour slots, on top of the chosen duration's price. */
export const PEAK_SURCHARGE = 50;

export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const startOfDay = (d: Date) => {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

/** yyyy-mm-dd from LOCAL date parts (toISOString() would shift the day for non-UTC users). */
const toLocalIsoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Converts a plain Date into the DateOption shape used throughout the booking flow. */
export const dateToOption = (d: Date): DateOption => {
  const today = startOfDay(new Date());

  return {
    id: toLocalIsoDate(d),
    date: d,
    dayLabel: DAY_LABELS[d.getDay()],
    dayNumber: String(d.getDate()),
    monthLabel: MONTH_LABELS[d.getMonth()],
    isToday: startOfDay(d).getTime() === today.getTime(),
  };
};

/** Builds `count` consecutive DateOptions starting from an arbitrary date. */
export const buildDateOptionsFrom = (start: Date, count: number): DateOption[] =>
  Array.from({ length: count }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return dateToOption(d);
  });

/**
 * Builds a full calendar grid (Sun-start weeks, padded with `null` outside
 * the month) for whatever month `anchor` falls in, along with a short
 * display label like "Sep 2026".
 */
export const buildMonthGrid = (anchor: Date) => {
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (DateOption | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(dateToOption(new Date(year, month, day)));
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (DateOption | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return { weeks, label: `${MONTH_LABELS[month]} ${year}` };
};