import { useState } from "react";
import type { AdminBooking } from "../services/bookingsService";
import {
  formatBookingDate,
  formatCurrency,
  formatTimeRange,
  getBookingTimeInfo,
} from "../lib/bookingTime";
import Spinner from "./Spinner";
import { PhoneIcon, UserIcon } from "./icons";

type BookingCardProps = {
  booking: AdminBooking;
  now: number;
  onCancel: (booking: AdminBooking) => Promise<void> | void;
  /** Hidden when omitted (e.g. on the customer details page). */
  onViewCustomer?: (booking: AdminBooking) => void;
};

const Field = ({ label, value }: { label: string; value: string }) => (
  <div className="min-w-0">
    <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">{label}</p>
    <p className="mt-0.5 truncate text-sm font-medium text-neutral-900">{value}</p>
  </div>
);

const BookingCard = ({ booking, now, onCancel, onViewCustomer }: BookingCardProps) => {
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const info = getBookingTimeInfo(booking.start_at, booking.end_at, booking.status, now);
  const canCancel = booking.status !== "cancelled" && new Date(booking.end_at).getTime() > now;

  const activityLabel = booking.table_label
    ? `${booking.activity_name} · ${booking.table_label}`
    : booking.activity_name;

  const handleCancel = async () => {
    if (cancelling) return;
    setCancelling(true);
    await onCancel(booking);
    setCancelling(false);
    setConfirming(false);
  };

  return (
    <li className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-neutral-900">{booking.customer_name}</p>
          <p className="mt-0.5 truncate text-xs text-neutral-500">
            #{booking.booking_code} · {booking.customer_phone}
          </p>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${info.tone}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${info.dot} ${info.pulse ? "animate-pulse" : ""}`} />
          {info.label}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Date" value={formatBookingDate(booking.start_at)} />
        <Field label="Time" value={formatTimeRange(booking.start_at, booking.end_at)} />
        <Field label="Activity" value={activityLabel} />
        <Field
          label="Players"
          value={`${booking.players} · ${booking.duration_label}`}
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-neutral-500">
        <span>Total</span>
        <span className="text-sm font-semibold text-neutral-900">{formatCurrency(booking.total)}</span>
      </div>

      {booking.customer_notes && (
        <p className="mt-3 rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
          {booking.customer_notes}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {onViewCustomer && (
          <button
            type="button"
            onClick={() => onViewCustomer(booking)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
          >
            <UserIcon width={14} height={14} />
            Customer
          </button>
        )}

        <a
          href={`tel:${booking.customer_phone.replace(/[^\d+]/g, "")}`}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
        >
          <PhoneIcon width={14} height={14} />
          Call
        </a>

        {canCancel &&
          (confirming ? (
            <>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={cancelling}
                className="flex-1 rounded-lg px-3 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100 disabled:opacity-50"
              >
                Keep
              </button>
              <button
                type="button"
                onClick={() => void handleCancel()}
                disabled={cancelling}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
              >
                {cancelling && <Spinner className="h-3 w-3" />}
                {cancelling ? "Cancelling…" : "Confirm cancel"}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="flex-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
            >
              Cancel booking
            </button>
          ))}
      </div>
    </li>
  );
};

export default BookingCard;