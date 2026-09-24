import { useState } from "react";
import type { AdminBooking } from "../services/bookingsService";
import {
  formatBookingDate,
  formatCurrency,
  formatTimeRange,
  getBookingTimeInfo,
} from "../lib/bookingTime";
import { PhoneIcon, UserIcon } from "./icons";
import Spinner from "./Spinner";

type BookingCardProps = {
  booking: AdminBooking;
  now: number;
  onCancel: (booking: AdminBooking) => Promise<void>;
  /** Hide the View Customer action when already on the customer page. */
  onViewCustomer?: (booking: AdminBooking) => void;
};

const Detail = ({ label, value }: { label: string; value: string }) => (
  <div className="min-w-0">
    <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">{label}</p>
    <p className="mt-0.5 truncate text-sm text-neutral-900">{value}</p>
  </div>
);

const BookingCard = ({ booking, now, onCancel, onViewCustomer }: BookingCardProps) => {
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const time = getBookingTimeInfo(booking.start_at, booking.end_at, booking.status, now);
  const isCancelled = booking.status === "cancelled";
  const isFinished = time.phase === "completed";
  const canCancel = !isCancelled && !isFinished;

  const activityLabel = booking.table_label
    ? `${booking.activity_name} · ${booking.table_label}`
    : booking.activity_name;

  const handleConfirmCancel = async () => {
    setCancelling(true);
    await onCancel(booking);
    setCancelling(false);
    setConfirming(false);
  };

  return (
    <li
      className={`rounded-2xl border bg-white p-4 transition-shadow hover:shadow-sm sm:p-5 ${
        time.phase === "soon" || time.phase === "starting_now"
          ? "border-amber-300"
          : "border-neutral-200"
      } ${isCancelled ? "opacity-70" : ""}`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-neutral-900">{booking.customer_name}</h3>
          <p className="mt-0.5 font-mono text-xs text-neutral-500">#{booking.booking_code}</p>
        </div>

        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${time.tone}`}
        >
          <span className="relative flex h-2 w-2">
            {time.pulse && (
              <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${time.dot}`} />
            )}
            <span className={`relative inline-flex h-2 w-2 rounded-full ${time.dot}`} />
          </span>
          {time.label}
        </span>
      </div>

      {/* Details */}
      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
        <Detail label="Activity" value={activityLabel} />
        <Detail label="Date" value={formatBookingDate(booking.start_at)} />
        <Detail label="Time" value={formatTimeRange(booking.start_at, booking.end_at)} />
        <Detail label="Duration" value={booking.duration_label} />
        <Detail label="Players" value={String(booking.players)} />
        <Detail label="Phone" value={booking.customer_phone} />
        <Detail label="Total" value={formatCurrency(booking.total)} />
        <Detail label="Status" value={isCancelled ? "Cancelled" : "Confirmed"} />
      </div>

      {booking.customer_notes && (
        <p className="mt-3 rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
          <span className="font-medium text-neutral-700">Note:</span> {booking.customer_notes}
        </p>
      )}

      {/* Actions */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <a
          href={`tel:${booking.customer_phone.replace(/[^\d+]/g, "")}`}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50 active:scale-[0.98] sm:flex-none"
        >
          <PhoneIcon width={14} height={14} />
          Call
        </a>

        {onViewCustomer && (
          <button
            type="button"
            onClick={() => onViewCustomer(booking)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50 active:scale-[0.98] sm:flex-none"
          >
            <UserIcon width={14} height={14} />
            View customer
          </button>
        )}

        {canCancel &&
          (confirming ? (
            <div className="flex w-full items-center gap-2 sm:ml-auto sm:w-auto">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={cancelling}
                className="flex-1 rounded-lg px-3 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100 disabled:opacity-50 sm:flex-none"
              >
                Keep booking
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmCancel()}
                disabled={cancelling}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-red-700 active:scale-[0.98] disabled:opacity-60 sm:flex-none"
              >
                {cancelling && <Spinner className="h-3 w-3" />}
                {cancelling ? "Cancelling…" : "Confirm cancel"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="flex-1 rounded-lg px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50 active:scale-[0.98] sm:ml-auto sm:flex-none"
            >
              Cancel booking
            </button>
          ))}
      </div>
    </li>
  );
};

export default BookingCard;