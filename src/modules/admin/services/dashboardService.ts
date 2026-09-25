import { supabase } from "../../../lib/supabase";
import { customerKeyOf } from "./bookingsService";

export type OccupiedTable = {
  activity_name: string;
  table_label: string;
  customer_name: string;
  end_at: string;
};

export type NextArrival = {
  id: string;
  customer_name: string;
  activity_name: string;
  table_label: string | null;
  start_at: string;
  players: number;
};

export type DashboardSnapshot = {
  // Today
  today_bookings: number;
  today_revenue: number;
  today_customers: number;
  today_cancelled: number;

  // Right now
  occupied_tables: OccupiedTable[];
  total_tables: number;
  available_tables: number;

  // Upcoming (next 3 hours)
  next_arrivals: NextArrival[];

  // 7-day trend (sparkline)
  last_7_days: { date: string; bookings: number; revenue: number }[];

  // Comparisons
  yesterday_bookings: number;
  week_over_week_bookings_delta: number; // percentage, e.g. 12.5 means +12.5%
};

type BookingRow = {
  id: string;
  activity_name: string;
  duration_minutes: number;
  total: number | string;
  players: number;
  start_at: string;
  end_at: string;
  customer_name: string;
  customer_phone: string;
  status: string;
  table: { label: string } | { label: string }[] | null;
};

const SELECT = `
  id, activity_name, duration_minutes, total, players,
  start_at, end_at, customer_name, customer_phone, status,
  table:activity_tables(label)
`;

const tableLabelOf = (row: BookingRow) => {
  const rel = Array.isArray(row.table) ? row.table[0] : row.table;
  return rel?.label ?? null;
};

/**
 * Loads everything the dashboard needs in two lightweight queries:
 *  1) bookings spanning "yesterday start" -> "3 hours from now" (covers
 *     today's stats, currently-occupied tables, and near-term arrivals,
 *     plus yesterday for the day-over-day comparison)
 *  2) a 7-day window for the trend sparkline
 *  3) a single count of active tables
 * No per-row follow-up requests are made.
 */
export const getDashboardSnapshot = async (): Promise<{ data: DashboardSnapshot | null; error: string | null }> => {
  const now = new Date();

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  const startOf7DaysAgo = new Date(startOfToday);
  startOf7DaysAgo.setDate(startOf7DaysAgo.getDate() - 6); // includes today = 7 days total

  const startOf14DaysAgo = new Date(startOfToday);
  startOf14DaysAgo.setDate(startOf14DaysAgo.getDate() - 13); // for week-over-week comparison

  const threeHoursFromNow = new Date(now.getTime() + 3 * 60 * 60 * 1000);

  const earliestNeeded = startOf14DaysAgo < startOfYesterday ? startOf14DaysAgo : startOfYesterday;

  const [bookingsRes, tablesRes] = await Promise.all([
    supabase
      .from("bookings")
      .select(SELECT)
      .gte("start_at", earliestNeeded.toISOString())
      .lte("start_at", threeHoursFromNow.toISOString())
      .order("start_at", { ascending: true })
      .limit(2000),
    supabase.from("activity_tables").select("id", { count: "exact", head: true }).eq("is_active", true),
  ]);

  if (bookingsRes.error) return { data: null, error: "Couldn't load dashboard data. Please try again." };

  const rows = (bookingsRes.data ?? []) as unknown as BookingRow[];
  const totalTables = tablesRes.count ?? 0;

  const nowMs = now.getTime();
  const startOfTodayIso = startOfToday.toISOString();
  const startOfYesterdayIso = startOfYesterday.toISOString();
  const startOf7DaysAgoIso = startOf7DaysAgo.toISOString();
  const startOf14DaysAgoIso = startOf14DaysAgo.toISOString();

  // ---- Today's stats ----
  const todayRows = rows.filter((r) => r.start_at >= startOfTodayIso && r.start_at < threeHoursFromNow.toISOString());
  const todayAllDay = rows.filter((r) => r.start_at >= startOfTodayIso);
  const todayActive = todayAllDay.filter((r) => r.status !== "cancelled");
  const todayCancelled = todayAllDay.filter((r) => r.status === "cancelled");

  const todayCustomerKeys = new Set(todayActive.map((r) => customerKeyOf(r.customer_phone)).filter(Boolean));

  // ---- Yesterday (same-period comparison uses full day) ----
  const yesterdayRows = rows.filter(
    (r) => r.start_at >= startOfYesterdayIso && r.start_at < startOfTodayIso && r.status !== "cancelled",
  );

  // ---- 7-day trend, zero-filled ----
  const dayMap = new Map<string, { bookings: number; revenue: number }>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOf7DaysAgo);
    d.setDate(d.getDate() + i);
    dayMap.set(d.toISOString().slice(0, 10), { bookings: 0, revenue: 0 });
  }
  for (const r of rows) {
    if (r.status === "cancelled") continue;
    if (r.start_at < startOf7DaysAgoIso) continue;
    const key = r.start_at.slice(0, 10);
    const bucket = dayMap.get(key);
    if (bucket) {
      bucket.bookings += 1;
      bucket.revenue += Number(r.total);
    }
  }
  const last_7_days = [...dayMap.entries()].map(([date, v]) => ({ date, ...v }));

  // ---- Week-over-week: this week (last 7d) vs prior week (8-14d ago) ----
  const thisWeekCount = rows.filter((r) => r.start_at >= startOf7DaysAgoIso && r.status !== "cancelled").length;
  const priorWeekCount = rows.filter(
    (r) => r.start_at >= startOf14DaysAgoIso && r.start_at < startOf7DaysAgoIso && r.status !== "cancelled",
  ).length;
  const week_over_week_bookings_delta =
    priorWeekCount > 0 ? ((thisWeekCount - priorWeekCount) / priorWeekCount) * 100 : thisWeekCount > 0 ? 100 : 0;

  // ---- Currently occupied tables (active bookings spanning "now") ----
  const occupied_tables: OccupiedTable[] = rows
    .filter((r) => r.status !== "cancelled" && r.start_at <= now.toISOString() && new Date(r.end_at).getTime() > nowMs)
    .map((r) => ({
      activity_name: r.activity_name,
      table_label: tableLabelOf(r) ?? "—",
      customer_name: r.customer_name,
      end_at: r.end_at,
    }))
    .sort((a, b) => new Date(a.end_at).getTime() - new Date(b.end_at).getTime());

  // ---- Next arrivals (upcoming, not yet started, within next 3h) ----
  const next_arrivals: NextArrival[] = rows
    .filter((r) => r.status !== "cancelled" && r.start_at > now.toISOString())
    .slice(0, 8)
    .map((r) => ({
      id: r.id,
      customer_name: r.customer_name,
      activity_name: r.activity_name,
      table_label: tableLabelOf(r),
      start_at: r.start_at,
      players: r.players,
    }));

  const snapshot: DashboardSnapshot = {
    today_bookings: todayActive.length,
    today_revenue: todayActive.reduce((sum, r) => sum + Number(r.total), 0),
    today_customers: todayCustomerKeys.size,
    today_cancelled: todayCancelled.length,

    occupied_tables,
    total_tables: totalTables,
    available_tables: Math.max(0, totalTables - occupied_tables.length),

    next_arrivals,

    last_7_days,

    yesterday_bookings: yesterdayRows.length,
    week_over_week_bookings_delta,
  };

  // Only count today rows that are truly "today" for the today_* fields above;
  // todayRows kept for potential future use / clarity in filtering intent.
  void todayRows;

  return { data: snapshot, error: null };
};