export type BookingPhase =
  | "cancelled"
  | "completed"
  | "in_progress"
  | "starting_now"
  | "soon"
  | "upcoming"
  | "later";

export type BookingTimeInfo = {
  phase: BookingPhase;
  label: string;
  /** Tailwind classes for the badge. */
  tone: string;
  /** Tailwind classes for the small dot. */
  dot: string;
  pulse: boolean;
};

const minutesBetween = (later: number, earlier: number) => Math.round((later - earlier) / 60000);

export const humanizeMinutes = (totalMinutes: number): string => {
  const mins = Math.max(0, Math.round(totalMinutes));
  if (mins < 60) return `${mins} min`;

  const hours = Math.floor(mins / 60);
  const rest = mins % 60;

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days} ${days === 1 ? "day" : "days"}`;
  }

  return rest === 0 ? `${hours} hr` : `${hours} hr ${rest} min`;
};

export const getBookingTimeInfo = (
  startAt: string,
  endAt: string,
  status: string,
  now: number = Date.now(),
): BookingTimeInfo => {
  if (status === "cancelled") {
    return {
      phase: "cancelled",
      label: "Cancelled",
      tone: "bg-neutral-100 text-neutral-500",
      dot: "bg-neutral-400",
      pulse: false,
    };
  }

  const start = new Date(startAt).getTime();
  const end = new Date(endAt).getTime();

  if (now >= end) {
    return {
      phase: "completed",
      label: "Completed",
      tone: "bg-neutral-100 text-neutral-500",
      dot: "bg-neutral-400",
      pulse: false,
    };
  }

  if (now >= start) {
    return {
      phase: "in_progress",
      label: `In progress · ${humanizeMinutes(minutesBetween(end, now))} left`,
      tone: "bg-emerald-100 text-emerald-700",
      dot: "bg-emerald-500",
      pulse: true,
    };
  }

  const minutesToStart = minutesBetween(start, now);

  if (minutesToStart <= 5) {
    return {
      phase: "starting_now",
      label: "Starting now",
      tone: "bg-red-100 text-red-700",
      dot: "bg-red-500",
      pulse: true,
    };
  }

  if (minutesToStart <= 60) {
    return {
      phase: "soon",
      label: `Arriving in ${humanizeMinutes(minutesToStart)}`,
      tone: "bg-amber-100 text-amber-800",
      dot: "bg-amber-500",
      pulse: true,
    };
  }

  const startDay = new Date(start);
  const today = new Date(now);
  const isToday = startDay.toDateString() === today.toDateString();

  if (isToday) {
    return {
      phase: "upcoming",
      label: `In ${humanizeMinutes(minutesToStart)}`,
      tone: "bg-sky-100 text-sky-700",
      dot: "bg-sky-500",
      pulse: false,
    };
  }

  return {
    phase: "later",
    label: `In ${humanizeMinutes(minutesToStart)}`,
    tone: "bg-neutral-100 text-neutral-600",
    dot: "bg-neutral-400",
    pulse: false,
  };
};

export const formatBookingDate = (iso: string): string =>
  new Date(iso).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });

export const formatTime = (iso: string): string =>
  new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

export const formatTimeRange = (startIso: string, endIso: string): string =>
  `${formatTime(startIso)} – ${formatTime(endIso)}`;

export const formatCurrency = (value: number): string =>
  `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export const formatHours = (minutes: number): string => {
  if (minutes < 60) return `${minutes} min`;
  const hours = minutes / 60;
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} hr`;
};