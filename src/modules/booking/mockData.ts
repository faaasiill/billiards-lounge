import type { Activity, DateOption, DurationOption, TimeSlot } from "./types";

/** Flat surcharge applied to peak-hour slots, on top of the chosen duration's price. */
export const PEAK_SURCHARGE = 50;

const durations = (prices: [number, number, number]): DurationOption[] => [
  { id: "30", minutes: 30, label: "30 min", price: prices[0] },
  { id: "60", minutes: 60, label: "60 min", price: prices[1] },
  { id: "90", minutes: 90, label: "90 min", price: prices[2] },
];

export const ACTIVITIES: Activity[] = [
  {
    id: "disc-pool",
    name: "Disc Pool",
    tagline: "Classic 8-ball, premium felt tables",
    image:
      "https://images.unsplash.com/photo-1642191135995-6de2cce0bbdc?auto=format&fit=crop&w=900&q=80",
    startingPrice: 150,
    players: "2-4 players",
    minPlayers: 2,
    maxPlayers: 4,
    durations: durations([150, 250, 340]),
  },
  {
    id: "ps5",
    name: "PS5 Game Station",
    tagline: "Latest titles, 4K OLED setup",
    image:
      "https://images.unsplash.com/photo-1606318801954-d46d46d3360a?auto=format&fit=crop&w=900&q=80",
    startingPrice: 110,
    players: "1-4 players",
    minPlayers: 1,
    maxPlayers: 4,
    durations: durations([110, 180, 240]),
  },
  {
    id: "chess",
    name: "Chess",
    tagline: "Tournament-grade boards & timers",
    image:
      "https://images.unsplash.com/photo-1528819622765-d6bcf132ac11?auto=format&fit=crop&w=900&q=80",
    startingPrice: 60,
    players: "2 players",
    minPlayers: 2,
    maxPlayers: 2,
    durations: durations([60, 100, 140]),
  },
];

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

/** Converts a plain Date into the DateOption shape used throughout the booking flow. */
export const dateToOption = (d: Date): DateOption => {
  const today = startOfDay(new Date());

  return {
    id: d.toISOString().slice(0, 10),
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

/** Builds `count` consecutive DateOptions starting today. */
export const buildDateOptions = (count: number): DateOption[] =>
  buildDateOptionsFrom(new Date(), count);

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

const BASE_TIMES = [
  "10:00", "11:00", "12:00", "13:00", "14:00", "15:00",
  "16:00", "17:00", "18:00", "19:00", "20:00", "21:00",
];

const PEAK_TIMES = new Set(["18:00", "19:00", "20:00"]);

const formatLabel = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
};

/**
 * Deterministic mock slot generator — the same activity + date always
 * produces the same availability, without needing a backend yet. Swap the
 * body of this function for a real API call later; callers (SlotGrid,
 * BookingPage) don't need to change.
 */
export const buildSlotsFor = (activity: Activity, date: DateOption): TimeSlot[] => {
  const seed =
    activity.id.length + date.id.split("-").reduce((sum, part) => sum + Number(part), 0);

  return BASE_TIMES.map((time, i) => {
    const unavailable = (seed + i) % 5 === 0;

    return {
      id: `${date.id}-${time}`,
      time,
      label: formatLabel(time),
      available: !unavailable,
      isPeak: PEAK_TIMES.has(time),
    };
  });
};