import Spinner from "../Spinner";
import Badge, { type BadgeTone } from "./Badge";
import {
  CHANNELS,
  EVENT_LABELS,
  describeReason,
  type DeliveryRecord,
  type DeliveryStatus,
} from "../../services/notificationsService";

type HistoryCardProps = {
  deliveries: DeliveryRecord[];
  refreshing: boolean;
  onRefresh: () => void;
};

const CLUB_TIME_ZONE = "Asia/Kolkata";

const timeFormatter = new Intl.DateTimeFormat("en-IN", {
  timeZone: CLUB_TIME_ZONE,
  day: "2-digit",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const STATUS_TONE: Record<DeliveryStatus, BadgeTone> = {
  sent: "ok",
  failed: "bad",
  pending: "warn",
  skipped: "muted",
};

const channelLabel = (id: string) => CHANNELS.find((c) => c.id === id)?.label ?? id;

const HistoryCard = ({ deliveries, refreshing, onRefresh }: HistoryCardProps) => (
  <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6">
    <div className="flex items-start justify-between gap-3">
      <div>
        <h3 className="text-sm font-medium text-neutral-900">Notification history</h3>
        <p className="mt-1 text-xs text-neutral-500">Latest 60 attempts. Times are club time (IST).</p>
      </div>
      <button
        type="button"
        onClick={onRefresh}
        disabled={refreshing}
        className="flex shrink-0 items-center justify-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
      >
        {refreshing && <Spinner className="h-3 w-3" />}
        Refresh
      </button>
    </div>

    {deliveries.length === 0 ? (
      <p className="mt-4 rounded-xl border border-dashed border-neutral-300 px-3 py-8 text-center text-xs text-neutral-500">
        Nothing sent yet. New bookings and test notifications will show up here.
      </p>
    ) : (
      <ul className="mt-4 divide-y divide-neutral-100 overflow-hidden rounded-xl border border-neutral-200">
        {deliveries.map((d) => {
          const reason = describeReason(d.failure_reason);
          return (
            <li key={d.id} className="flex flex-col gap-1.5 p-3.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-neutral-900">
                  {d.booking_code ? `#${d.booking_code}` : "Test"} · {EVENT_LABELS[d.event_type] ?? d.event_type}
                </p>
                <p className="truncate text-xs text-neutral-500">
                  {channelLabel(d.channel)}
                  {d.destination_label && d.destination_label !== "n/a" ? ` · ${d.destination_label}` : ""}
                  {reason ? ` · ${reason}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-xs text-neutral-500">{timeFormatter.format(new Date(d.created_at))}</span>
                <Badge tone={STATUS_TONE[d.status]}>{d.status}</Badge>
              </div>
            </li>
          );
        })}
      </ul>
    )}
  </section>
);

export default HistoryCard;