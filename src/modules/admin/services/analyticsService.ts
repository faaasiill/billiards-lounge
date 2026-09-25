import { supabase } from "../../../lib/supabase";
import { customerKeyOf } from "./bookingsService";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type RangeDays = 7 | 30 | 90;

export type RevenuePoint = { date: string; total: number; bookings: number };

export type ActivityBreakdown = {
  activity_id: string;
  activity_name: string;
  bookings: number;
  revenue: number;
  minutes: number;
  avg_players: number;
};

export type TableUtilization = {
  activity_name: string;
  table_label: string;
  bookings: number;
  minutes_booked: number;
};

export type HourBucket = { hour: number; bookings: number };
export type WeekdayBucket = { weekday: number; bookings: number };

export type AnalyticsSummary = {
  range_days: RangeDays;
  total_bookings: number;
  cancelled_bookings: number;
  cancellation_rate: number; // 0..1
  total_revenue: number;
  avg_booking_value: number;
  unique_customers: number;
  new_customers: number;
  repeat_customer_rate: number; // 0..1
  avg_players_per_booking: number;
  revenue_series: RevenuePoint[];
  by_activity: ActivityBreakdown[];
  by_hour: HourBucket[];
  by_weekday: WeekdayBucket[];
  table_utilization: TableUtilization[];
  top_customers: { name: string; phone: string; bookings: number; spent: number }[];
};

/* ------------------------------------------------------------------ */
/*  Internal row shape pulled from Supabase (single query)             */
/* ------------------------------------------------------------------ */

type AnalyticsRow = {
  id: string;
  activity_id: string;
  activity_name: string;
  duration_minutes: number;
  total: number | string;
  players: number;
  start_at: string;
  customer_name: string;
  customer_phone: string;
  status: string;
  table: { label: string } | { label: string }[] | null;
};

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export { WEEKDAY_LABELS };

const toMessage = (): string => "Couldn't load analytics. Please try again.";

/* ------------------------------------------------------------------ */
/*  Main entry point — ONE bookings query + ONE tables count query.    */
/*  Everything else is derived client-side to avoid N+1 round trips.   */
/* ------------------------------------------------------------------ */

export const getAnalyticsSummary = async (
  rangeDays: RangeDays,
): Promise<{ data: AnalyticsSummary | null; error: string | null }> => {
  const since = new Date();
  since.setDate(since.getDate() - rangeDays);
  const sinceIso = since.toISOString();

  const { data, error } = await supabase
    .from("bookings")
    .select(
      `id, activity_id, activity_name, duration_minutes, total, players,
       start_at, customer_name, customer_phone, status,
       table:activity_tables(label)`,
    )
    .gte("start_at", sinceIso)
    .order("start_at", { ascending: true })
    .limit(5000);

  if (error) return { data: null, error: toMessage() };

  const rows = (data ?? []) as unknown as AnalyticsRow[];
  const active = rows.filter((r) => r.status !== "cancelled");
  const cancelled = rows.filter((r) => r.status === "cancelled");

  // ---- Revenue series (day buckets, zero-filled for a clean chart) ----
  const dayKey = (iso: string) => iso.slice(0, 10);
  const revenueMap = new Map<string, { total: number; bookings: number }>();
  for (let i = 0; i < rangeDays; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    revenueMap.set(d.toISOString().slice(0, 10), { total: 0, bookings: 0 });
  }
  for (const b of active) {
    const key = dayKey(b.start_at);
    const bucket = revenueMap.get(key);
    if (bucket) {
      bucket.total += Number(b.total);
      bucket.bookings += 1;
    }
  }
  const revenue_series: RevenuePoint[] = [...revenueMap.entries()].map(([date, v]) => ({
    date,
    total: v.total,
    bookings: v.bookings,
  }));

  // ---- By activity ----
  const activityMap = new Map<
    string,
    { name: string; bookings: number; revenue: number; minutes: number; players: number }
  >();
  for (const b of active) {
    const entry = activityMap.get(b.activity_id) ?? {
      name: b.activity_name,
      bookings: 0,
      revenue: 0,
      minutes: 0,
      players: 0,
    };
    entry.bookings += 1;
    entry.revenue += Number(b.total);
    entry.minutes += b.duration_minutes;
    entry.players += b.players;
    activityMap.set(b.activity_id, entry);
  }
  const by_activity: ActivityBreakdown[] = [...activityMap.entries()]
    .map(([activity_id, v]) => ({
      activity_id,
      activity_name: v.name,
      bookings: v.bookings,
      revenue: v.revenue,
      minutes: v.minutes,
      avg_players: v.bookings > 0 ? v.players / v.bookings : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  // ---- By hour of day / weekday (demand pattern) ----
  const hourMap = new Map<number, number>();
  const weekdayMap = new Map<number, number>();
  for (const b of active) {
    const d = new Date(b.start_at);
    const hour = d.getHours();
    const weekday = d.getDay();
    hourMap.set(hour, (hourMap.get(hour) ?? 0) + 1);
    weekdayMap.set(weekday, (weekdayMap.get(weekday) ?? 0) + 1);
  }
  const by_hour: HourBucket[] = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    bookings: hourMap.get(hour) ?? 0,
  }));
  const by_weekday: WeekdayBucket[] = Array.from({ length: 7 }, (_, weekday) => ({
    weekday,
    bookings: weekdayMap.get(weekday) ?? 0,
  }));

  // ---- Table utilization ----
  const tableMap = new Map<string, { activity_name: string; table_label: string; bookings: number; minutes: number }>();
  for (const b of active) {
    const tableRel = Array.isArray(b.table) ? b.table[0] : b.table;
    const label = tableRel?.label ?? "—";
    const key = `${b.activity_name}::${label}`;
    const entry = tableMap.get(key) ?? {
      activity_name: b.activity_name,
      table_label: label,
      bookings: 0,
      minutes: 0,
    };
    entry.bookings += 1;
    entry.minutes += b.duration_minutes;
    tableMap.set(key, entry);
  }
  const table_utilization: TableUtilization[] = [...tableMap.values()]
    .map((v) => ({
      activity_name: v.activity_name,
      table_label: v.table_label,
      bookings: v.bookings,
      minutes_booked: v.minutes,
    }))
    .sort((a, b) => b.minutes_booked - a.minutes_booked);

  // ---- Customers ----
  const customerMap = new Map<string, { name: string; phone: string; bookings: number; spent: number; first: string }>();
  for (const b of active) {
    const key = customerKeyOf(b.customer_phone);
    if (!key) continue;
    const entry = customerMap.get(key) ?? {
      name: b.customer_name,
      phone: b.customer_phone,
      bookings: 0,
      spent: 0,
      first: b.start_at,
    };
    entry.bookings += 1;
    entry.spent += Number(b.total);
    if (b.start_at < entry.first) entry.first = b.start_at;
    entry.name = b.customer_name;
    entry.phone = b.customer_phone;
    customerMap.set(key, entry);
  }
  const customers = [...customerMap.values()];
  const unique_customers = customers.length;
  const new_customers = customers.filter((c) => c.first >= sinceIso).length;
  const repeat_customers = customers.filter((c) => c.bookings > 1).length;

  const top_customers = customers
    .slice()
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 5)
    .map((c) => ({ name: c.name, phone: c.phone, bookings: c.bookings, spent: c.spent }));

  const total_revenue = active.reduce((sum, b) => sum + Number(b.total), 0);
  const total_players = active.reduce((sum, b) => sum + b.players, 0);

  const summary: AnalyticsSummary = {
    range_days: rangeDays,
    total_bookings: rows.length,
    cancelled_bookings: cancelled.length,
    cancellation_rate: rows.length > 0 ? cancelled.length / rows.length : 0,
    total_revenue,
    avg_booking_value: active.length > 0 ? total_revenue / active.length : 0,
    unique_customers,
    new_customers,
    repeat_customer_rate: unique_customers > 0 ? repeat_customers / unique_customers : 0,
    avg_players_per_booking: active.length > 0 ? total_players / active.length : 0,
    revenue_series,
    by_activity,
    by_hour,
    by_weekday,
    table_utilization,
    top_customers,
  };

  return { data: summary, error: null };
};