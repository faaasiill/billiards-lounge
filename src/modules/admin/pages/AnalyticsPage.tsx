import { useCallback, useEffect, useState } from "react";
import {
  getAnalyticsSummary,
  WEEKDAY_LABELS,
  type AnalyticsSummary,
  type RangeDays,
} from "../services/analyticsservice";
import { formatCurrency, humanizeMinutes } from "../lib/bookingTime";
import { AnalyticsSkeleton } from "../components/Dashboardskeletons";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";

const RANGE_OPTIONS: { id: RangeDays; label: string }[] = [
  { id: 7, label: "7 days" },
  { id: 30, label: "30 days" },
  { id: 90, label: "90 days" },
];

/* ------------------------------------------------------------------ */
/*  Small chart primitives — dependency-free SVG, matches design system */
/* ------------------------------------------------------------------ */

const RevenueChart = ({ points }: { points: AnalyticsSummary["revenue_series"] }) => {
  const width = 800;
  const height = 220;
  const max = Math.max(1, ...points.map((p) => p.total));
  const stepX = points.length > 1 ? width / (points.length - 1) : width;

  const coords = points.map((p, i) => ({
    x: i * stepX,
    y: height - (p.total / max) * (height - 24) - 6,
    ...p,
  }));

  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
  const areaPath = `${linePath} L ${coords[coords.length - 1]?.x ?? 0} ${height} L 0 ${height} Z`;

  // Thin out x-axis labels so they don't collide on longer ranges.
  const labelEvery = Math.max(1, Math.ceil(points.length / 10));

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[480px]" preserveAspectRatio="none" role="img" aria-label="Revenue over time">
        <defs>
          <linearGradient id="analytics-rev-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#171717" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#171717" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#analytics-rev-fill)" />
        <path d={linePath} fill="none" stroke="#171717" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="mt-1.5 flex justify-between text-[10px] text-neutral-400">
        {points.map((p, i) =>
          i % labelEvery === 0 ? (
            <span key={p.date}>{new Date(`${p.date}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
          ) : null,
        )}
      </div>
    </div>
  );
};

const HourHeatRow = ({ buckets }: { buckets: AnalyticsSummary["by_hour"] }) => {
  const max = Math.max(1, ...buckets.map((b) => b.bookings));
  return (
    <div className="flex items-end gap-[3px]">
      {buckets.map((b) => {
        const heightPct = (b.bookings / max) * 100;
        return (
          <div key={b.hour} className="group relative flex-1" title={`${b.hour}:00 — ${b.bookings} bookings`}>
            <div
              className="rounded-sm bg-neutral-900 transition-opacity"
              style={{ height: `${Math.max(3, heightPct)}%`, opacity: 0.25 + (heightPct / 100) * 0.75 }}
            />
          </div>
        );
      })}
    </div>
  );
};

const WeekdayBars = ({ buckets }: { buckets: AnalyticsSummary["by_weekday"] }) => {
  const max = Math.max(1, ...buckets.map((b) => b.bookings));
  return (
    <div className="flex items-end justify-between gap-2">
      {buckets.map((b) => (
        <div key={b.weekday} className="flex flex-1 flex-col items-center gap-1.5">
          <div className="flex h-24 w-full items-end">
            <div
              className="w-full rounded-t-md bg-neutral-900"
              style={{ height: `${Math.max(4, (b.bookings / max) * 100)}%`, opacity: 0.85 }}
            />
          </div>
          <span className="text-[10px] text-neutral-400">{WEEKDAY_LABELS[b.weekday]}</span>
        </div>
      ))}
    </div>
  );
};

const MiniStat = ({ label, value, hint }: { label: string; value: string; hint?: string }) => (
  <div className="rounded-2xl border border-neutral-200 bg-white p-4">
    <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">{label}</p>
    <p className="mt-1.5 text-xl font-semibold tracking-tight text-neutral-900">{value}</p>
    {hint && <p className="mt-0.5 text-xs text-neutral-500">{hint}</p>}
  </div>
);

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

const AnalyticsPage = () => {
  const [range, setRange] = useState<RangeDays>(30);
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (rangeDays: RangeDays) => {
    setLoading(true);
    setError(null);
    const { data: summary, error: loadError } = await getAnalyticsSummary(rangeDays);
    setData(summary);
    setError(loadError);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(range);
  }, [load, range]);

  if (loading) return <AnalyticsSkeleton />;

  if (error || !data) {
    return (
      <ErrorState
        description={error ?? "Couldn't load analytics."}
        action={
          <button
            onClick={() => void load(range)}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Try again
          </button>
        }
      />
    );
  }

  const hasData = data.total_bookings > 0;
  const maxActivityRevenue = Math.max(1, ...data.by_activity.map((a) => a.revenue));
  const maxTableMinutes = Math.max(1, ...data.table_utilization.map((t) => t.minutes_booked));

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl">Analytics</h2>
          <p className="mt-1 text-sm text-neutral-500">Booking, customer and resource insights.</p>
        </div>

        <div className="flex gap-1.5 self-start rounded-lg border border-neutral-200 bg-white p-1">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setRange(opt.id)}
              aria-pressed={range === opt.id}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                range === opt.id ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      {!hasData ? (
        <EmptyState
          title="No bookings in this range"
          description="Try a longer range, or check back once bookings come in."
        />
      ) : (
        <>
          {/* Top-line metrics */}
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MiniStat
              label="Total revenue"
              value={formatCurrency(data.total_revenue)}
              hint={`${formatCurrency(data.avg_booking_value)} avg / booking`}
            />
            <MiniStat
              label="Bookings"
              value={String(data.total_bookings)}
              hint={`${(data.cancellation_rate * 100).toFixed(1)}% cancelled`}
            />
            <MiniStat
              label="Customers"
              value={String(data.unique_customers)}
              hint={`${data.new_customers} new this range`}
            />
            <MiniStat
              label="Repeat rate"
              value={`${(data.repeat_customer_rate * 100).toFixed(0)}%`}
              hint={`${data.avg_players_per_booking.toFixed(1)} avg players`}
            />
          </section>

          {/* Revenue trend */}
          <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-neutral-900">Revenue trend</h3>
              <span className="text-xs text-neutral-400">Last {data.range_days} days</span>
            </div>
            <div className="mt-4">
              <RevenueChart points={data.revenue_series} />
            </div>
          </section>

          {/* Demand patterns */}
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6">
              <h3 className="text-sm font-medium text-neutral-900">Busiest hours</h3>
              <p className="mt-0.5 text-xs text-neutral-500">Bookings by hour of day (0–23h).</p>
              <div className="mt-4 h-20">
                <HourHeatRow buckets={data.by_hour} />
              </div>
              <div className="mt-1.5 flex justify-between text-[10px] text-neutral-400">
                <span>12am</span>
                <span>12pm</span>
                <span>11pm</span>
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6">
              <h3 className="text-sm font-medium text-neutral-900">Busiest days</h3>
              <p className="mt-0.5 text-xs text-neutral-500">Bookings by day of week.</p>
              <div className="mt-4">
                <WeekdayBars buckets={data.by_weekday} />
              </div>
            </div>
          </section>

          {/* Activity performance + table utilization */}
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6">
              <h3 className="text-sm font-medium text-neutral-900">Revenue by activity</h3>
              <ul className="mt-4 flex flex-col gap-3">
                {data.by_activity.map((a) => (
                  <li key={a.activity_id}>
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate font-medium text-neutral-900">{a.activity_name}</span>
                      <span className="shrink-0 text-neutral-600">{formatCurrency(a.revenue)}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                      <div
                        className="h-full rounded-full bg-neutral-900"
                        style={{ width: `${Math.max(4, (a.revenue / maxActivityRevenue) * 100)}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-neutral-400">
                      {a.bookings} bookings · {humanizeMinutes(a.minutes)} · {a.avg_players.toFixed(1)} avg players
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6">
              <h3 className="text-sm font-medium text-neutral-900">Table utilization</h3>
              <p className="mt-0.5 text-xs text-neutral-500">Time booked per table, this range.</p>
              <ul className="mt-4 flex flex-col gap-3">
                {data.table_utilization.slice(0, 8).map((t) => (
                  <li key={`${t.activity_name}-${t.table_label}`}>
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate font-medium text-neutral-900">
                        {t.activity_name} · {t.table_label}
                      </span>
                      <span className="shrink-0 text-neutral-600">{humanizeMinutes(t.minutes_booked)}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                      <div
                        className="h-full rounded-full bg-neutral-900"
                        style={{ width: `${Math.max(4, (t.minutes_booked / maxTableMinutes) * 100)}%`, opacity: 0.75 }}
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-neutral-400">{t.bookings} bookings</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Top customers */}
          <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6">
            <h3 className="text-sm font-medium text-neutral-900">Top customers</h3>
            <ul className="mt-4 divide-y divide-neutral-100">
              {data.top_customers.map((c, i) => (
                <li key={c.phone} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-medium text-neutral-500">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-neutral-900">{c.name}</p>
                      <p className="truncate text-xs text-neutral-500">{c.bookings} bookings</p>
                    </div>
                  </div>
                  <span className="shrink-0 text-sm font-medium text-neutral-900">{formatCurrency(c.spent)}</span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
};

export default AnalyticsPage;