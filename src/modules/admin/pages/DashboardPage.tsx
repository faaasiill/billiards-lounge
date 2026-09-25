import { useCallback, useEffect, useState } from "react";
import { useAdminAuth } from "../context/AdminAuthContext";
import { useAdminRoute } from "../hooks/useAdminRoute";
import { useNow } from "../hooks/useNow";
import { getDashboardSnapshot, type DashboardSnapshot } from "../services/dashboardservice";
import { customerKeyOf } from "../services/bookingsService";
import { formatCurrency, formatTime, humanizeMinutes } from "../lib/bookingTime";
import { DashboardSkeleton } from "../components/Dashboardskeletons";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";
import {
  CalendarIcon,
  ChartIcon,
  TableIcon,
  UsersIcon,
} from "../components/icons";

/* ------------------------------------------------------------------ */
/*  Small building blocks                                              */
/* ------------------------------------------------------------------ */

type TrendDirection = "up" | "down" | "flat";

const TrendBadge = ({ value, direction }: { value: string; direction: TrendDirection }) => {
  const tone =
    direction === "up"
      ? "bg-emerald-100 text-emerald-700"
      : direction === "down"
        ? "bg-red-100 text-red-700"
        : "bg-neutral-100 text-neutral-500";
  const arrow = direction === "up" ? "↑" : direction === "down" ? "↓" : "→";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${tone}`}>
      {arrow} {value}
    </span>
  );
};

const StatCard = ({
  label,
  value,
  icon,
  footer,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  footer?: React.ReactNode;
}) => (
  <div className="rounded-2xl border border-neutral-200 bg-white p-4 transition-shadow hover:shadow-sm">
    <div className="flex items-center justify-between">
      <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">{label}</p>
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500">
        {icon}
      </span>
    </div>
    <p className="mt-2 text-2xl font-semibold tracking-tight text-neutral-900">{value}</p>
    {footer && <div className="mt-1.5">{footer}</div>}
  </div>
);

/** Minimal inline sparkline — no chart library needed for 7 points. */
const Sparkline = ({ points, height = 140 }: { points: { date: string; bookings: number; revenue: number }[]; height?: number }) => {
  const width = 560;
  const max = Math.max(1, ...points.map((p) => p.revenue));
  const stepX = width / Math.max(1, points.length - 1);

  const coords = points.map((p, i) => {
    const x = i * stepX;
    const y = height - (p.revenue / max) * (height - 20) - 4;
    return { x, y, ...p };
  });

  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
  const areaPath = `${linePath} L ${coords[coords.length - 1]?.x ?? 0} ${height} L 0 ${height} Z`;

  const dayLabel = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { weekday: "short" });

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none" role="img" aria-label="Revenue trend, last 7 days">
        <defs>
          <linearGradient id="dash-rev-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#171717" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#171717" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#dash-rev-fill)" />
        <path d={linePath} fill="none" stroke="#171717" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {coords.map((c) => (
          <circle key={c.date} cx={c.x} cy={c.y} r={3} fill="#171717" />
        ))}
      </svg>
      <div className="mt-1.5 flex justify-between text-[10px] text-neutral-400">
        {points.map((p) => (
          <span key={p.date}>{dayLabel(p.date)}</span>
        ))}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

const DashboardPage = () => {
  const { user } = useAdminAuth();
  const { navigate } = useAdminRoute();
  const now = useNow(60_000);

  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const { data, error: loadError } = await getDashboardSnapshot();
    if (data) setSnapshot(data);
    setError(loadError);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  // Keep the dashboard current without the person having to refresh — a
  // 60s poll is enough for an operational overview without hammering the DB.
  useEffect(() => {
    const id = window.setInterval(() => void load(), 60_000);
    return () => window.clearInterval(id);
  }, [load]);

  const name =
    (typeof user?.user_metadata?.full_name === "string" && user.user_metadata.full_name) ||
    user?.email?.split("@")[0] ||
    "there";

  if (loading) return <DashboardSkeleton />;

  if (error || !snapshot) {
    return (
      <ErrorState
        description={error ?? "Couldn't load the dashboard."}
        action={
          <button
            onClick={() => {
              setLoading(true);
              void load();
            }}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Try again
          </button>
        }
      />
    );
  }

  const occupancyPct =
    snapshot.total_tables > 0 ? Math.round((snapshot.occupied_tables.length / snapshot.total_tables) * 100) : 0;

  const wowDirection: TrendDirection =
    snapshot.week_over_week_bookings_delta > 1 ? "up" : snapshot.week_over_week_bookings_delta < -1 ? "down" : "flat";

  const bookingsDeltaVsYesterday = snapshot.today_bookings - snapshot.yesterday_bookings;
  const dayDirection: TrendDirection = bookingsDeltaVsYesterday > 0 ? "up" : bookingsDeltaVsYesterday < 0 ? "down" : "flat";

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-neutral-900">Welcome back, {name}</h2>
          <p className="mt-1 text-sm text-neutral-500">Here's what's happening at the club right now.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate("/admin/bookings")}
            className="rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            View bookings
          </button>
        </div>
      </section>

      {/* Top stat row — the four numbers that matter most, at a glance */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Today's bookings"
          value={String(snapshot.today_bookings)}
          icon={<CalendarIcon width={16} height={16} />}
          footer={<TrendBadge value={`${bookingsDeltaVsYesterday >= 0 ? "+" : ""}${bookingsDeltaVsYesterday} vs yesterday`} direction={dayDirection} />}
        />
        <StatCard
          label="Today's revenue"
          value={formatCurrency(snapshot.today_revenue)}
          icon={<ChartIcon width={16} height={16} />}
          footer={
            snapshot.today_cancelled > 0 ? (
              <span className="text-[11px] text-neutral-400">{snapshot.today_cancelled} cancelled today</span>
            ) : (
              <span className="text-[11px] text-neutral-400">No cancellations today</span>
            )
          }
        />
        <StatCard
          label="Tables occupied"
          value={`${snapshot.occupied_tables.length} / ${snapshot.total_tables}`}
          icon={<TableIcon width={16} height={16} />}
          footer={
            <span className="text-[11px] text-neutral-400">
              {occupancyPct}% occupancy · {snapshot.available_tables} free
            </span>
          }
        />
        <StatCard
          label="Today's customers"
          value={String(snapshot.today_customers)}
          icon={<UsersIcon width={16} height={16} />}
          footer={<TrendBadge value={`${snapshot.week_over_week_bookings_delta >= 0 ? "+" : ""}${snapshot.week_over_week_bookings_delta.toFixed(0)}% this week`} direction={wowDirection} />}
        />
      </section>

      {/* Trend + Next arrivals */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-neutral-900">Revenue, last 7 days</h3>
            <span className="text-xs text-neutral-400">
              {formatCurrency(snapshot.last_7_days.reduce((s, d) => s + d.revenue, 0))} total
            </span>
          </div>
          <div className="mt-4">
            <Sparkline points={snapshot.last_7_days} />
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-neutral-900">Arriving soon</h3>
            <span className="text-xs text-neutral-400">Next 3 hrs</span>
          </div>

          {snapshot.next_arrivals.length === 0 ? (
            <p className="mt-6 text-center text-xs text-neutral-400">No arrivals in the next 3 hours.</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-2.5">
              {snapshot.next_arrivals.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/customers/${customerKeyOf(a.customer_name)}`)}
                    className="flex w-full items-center justify-between gap-2 rounded-xl border border-neutral-100 bg-neutral-50 px-3 py-2.5 text-left transition hover:bg-neutral-100"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-neutral-900">{a.customer_name}</p>
                      <p className="truncate text-xs text-neutral-500">
                        {a.activity_name}
                        {a.table_label ? ` · ${a.table_label}` : ""} · {a.players} {a.players === 1 ? "player" : "players"}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-white px-2 py-1 text-xs font-medium text-neutral-700 shadow-sm">
                      {formatTime(a.start_at)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Occupied now + quick actions */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-neutral-900">Occupied right now</h3>
            <span className="text-xs text-neutral-400">Live · updates every minute</span>
          </div>

          {snapshot.occupied_tables.length === 0 ? (
            <div className="mt-4">
              <EmptyState title="All tables are free" description="No one is currently playing." />
            </div>
          ) : (
            <ul className="mt-4 flex flex-col gap-2">
              {snapshot.occupied_tables.map((t, i) => {
                const minsLeft = Math.max(0, Math.round((new Date(t.end_at).getTime() - now) / 60000));
                return (
                  <li
                    key={`${t.activity_name}-${t.table_label}-${i}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-neutral-100 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-neutral-900">
                        {t.activity_name} · {t.table_label}
                      </p>
                      <p className="truncate text-xs text-neutral-500">{t.customer_name}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                      {humanizeMinutes(minsLeft)} left
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6">
          <h3 className="text-sm font-medium text-neutral-900">Quick actions</h3>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <button
              onClick={() => navigate("/admin/bookings")}
              className="flex flex-col items-start gap-1.5 rounded-xl border border-neutral-200 p-3.5 text-left transition hover:bg-neutral-50"
            >
              <CalendarIcon width={18} height={18} className="text-neutral-500" />
              <span className="text-xs font-medium text-neutral-900">Manage bookings</span>
            </button>
            <button
              onClick={() => navigate("/admin/customers")}
              className="flex flex-col items-start gap-1.5 rounded-xl border border-neutral-200 p-3.5 text-left transition hover:bg-neutral-50"
            >
              <UsersIcon width={18} height={18} className="text-neutral-500" />
              <span className="text-xs font-medium text-neutral-900">View customers</span>
            </button>
            <button
              onClick={() => navigate("/admin/activities")}
              className="flex flex-col items-start gap-1.5 rounded-xl border border-neutral-200 p-3.5 text-left transition hover:bg-neutral-50"
            >
              <TableIcon width={18} height={18} className="text-neutral-500" />
              <span className="text-xs font-medium text-neutral-900">Activities & tables</span>
            </button>
            <button
              onClick={() => navigate("/admin/analytics")}
              className="flex flex-col items-start gap-1.5 rounded-xl border border-neutral-200 p-3.5 text-left transition hover:bg-neutral-50"
            >
              <ChartIcon width={18} height={18} className="text-neutral-500" />
              <span className="text-xs font-medium text-neutral-900">Open analytics</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;