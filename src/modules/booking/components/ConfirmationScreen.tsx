import { PEAK_SURCHARGE } from "../mockData";
import type { BookingDraft } from "../types";

type ConfirmationScreenProps = {
  draft: BookingDraft;
  bookingId: string;
  onDone: () => void;
  /** Navigates to the My Bookings page. Omit to hide the button. */
  onViewBookings?: () => void;
};

const CheckIcon = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const TicketIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4Z" />
    <path d="M13 6v2M13 16v2M13 11v2" />
  </svg>
);

const Row = ({ label, value, accent }: { label: string; value: string; accent?: boolean }) => (
  <div className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
    <span className="text-xs tracking-tighter text-ivory/55 light:text-felt-dark/55">{label}</span>
    <span
      className={
        accent
          ? "font-display tracking-[-0.02em] text-brass"
          : "text-sm font-medium tracking-tight text-ivory light:text-felt-dark"
      }
    >
      {value}
    </span>
  </div>
);

const ConfirmationScreen = ({ draft, bookingId, onDone, onViewBookings }: ConfirmationScreenProps) => {
  if (!draft.activity || !draft.date || !draft.slot || !draft.duration || !draft.players) return null;

  const total = draft.duration.price + (draft.slot.isPeak ? PEAK_SURCHARGE : 0);

  return (
    <div className="flex h-full flex-col items-center justify-center overflow-y-auto px-8 py-8 text-center">
      <div className="flex h-16 w-16 animate-[pop-in_480ms_cubic-bezier(0.34,1.56,0.64,1)] items-center justify-center rounded-full bg-brass text-felt-dark">
        <CheckIcon />
      </div>

      <h1
        className="mt-6 animate-[fade-slide-up_420ms_ease-out] font-display text-2xl tracking-[-0.06em] text-ivory light:text-felt-dark"
        style={{ animationDelay: "120ms", animationFillMode: "backwards" }}
      >
        You're all set
      </h1>
      <p
        className="mt-1.5 animate-[fade-slide-up_420ms_ease-out] text-sm tracking-tight text-ivory/60 light:text-felt-dark/60"
        style={{ animationDelay: "180ms", animationFillMode: "backwards" }}
      >
        Booking #{bookingId} is confirmed
      </p>

      <div
        className="mt-8 w-full animate-[fade-slide-up_420ms_ease-out] text-left"
        style={{ animationDelay: "240ms", animationFillMode: "backwards" }}
      >
        <span className="font-display text-lg tracking-[-0.04em] text-ivory light:text-felt-dark">
          {draft.activity.name}
        </span>

        <div className="mt-3 flex flex-col divide-y divide-ivory/10 light:divide-felt-dark/10">
          <Row label="Date" value={`${draft.date.dayLabel}, ${draft.date.dayNumber} ${draft.date.monthLabel}`} />
          <Row label="Time" value={draft.slot.label} />
          <Row label="Duration" value={draft.duration.label} />
          <Row label="Players" value={`${draft.players} ${draft.players === 1 ? "player" : "players"}`} />
          <Row label="Total paid" value={`₹${total}`} accent />
        </div>
      </div>

      <div
        className="mt-8 flex w-full animate-[fade-slide-up_420ms_ease-out] flex-col gap-2.5"
        style={{ animationDelay: "300ms", animationFillMode: "backwards" }}
      >
        {onViewBookings && (
          <button
            onClick={onViewBookings}
            className="group flex w-full items-center justify-between rounded-full border border-ivory/10 bg-ivory px-5 py-3.5 text-felt-dark transition-all duration-300 hover:bg-brass active:scale-[0.98] light:border-felt-dark/10 light:bg-felt-dark light:text-ivory light:hover:text-felt-dark"
          >
            <span className="ml-1.5 flex items-center gap-2 text-sm font-medium tracking-tight">
              <TicketIcon />
              View My Bookings
            </span>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-felt-dark text-ivory transition-transform duration-300 group-hover:translate-x-0.5 light:bg-ivory light:text-felt-dark">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="m13 6 6 6-6 6" />
              </svg>
            </span>
          </button>
        )}

        <button
          onClick={onDone}
          className="w-full rounded-full py-3.5 text-sm font-medium tracking-tight text-ivory/70 transition-all duration-200 active:scale-[0.98] active:bg-ivory/10 light:text-felt-dark/70 light:active:bg-felt-dark/10"
        >
          Back to activities
        </button>
      </div>
    </div>
  );
};

export default ConfirmationScreen;