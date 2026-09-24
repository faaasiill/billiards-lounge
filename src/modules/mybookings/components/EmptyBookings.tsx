type EmptyBookingsProps = {
  title?: string;
  description?: string;
  onStartBooking: () => void;
};

const CalendarIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="16" rx="3" />
    <path d="M8 3v4M16 3v4M3 10h18" />
  </svg>
);

/**
 * Shown when the user has no confirmed bookings yet (or isn't logged in).
 * Mirrors the confirmation screen's centered, icon-led layout so the empty
 * and "success" states of the same flow feel related.
 */
const EmptyBookings = ({
  title = "No bookings yet",
  description = "Reserve a table or game and it'll show up here.",
  onStartBooking,
}: EmptyBookingsProps) => {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
      <div className="flex h-16 w-16 animate-[pop-in_480ms_cubic-bezier(0.34,1.56,0.64,1)] items-center justify-center rounded-full bg-ivory/10 text-ivory/60 light:bg-felt-dark/10 light:text-felt-dark/60">
        <CalendarIcon />
      </div>

      <h1
        className="mt-6 animate-[fade-slide-up_420ms_ease-out] font-display text-2xl tracking-[-0.06em] text-ivory light:text-felt-dark"
        style={{ animationDelay: "120ms", animationFillMode: "backwards" }}
      >
        {title}
      </h1>
      <p
        className="mt-1.5 animate-[fade-slide-up_420ms_ease-out] text-sm tracking-tight text-ivory/60 light:text-felt-dark/60"
        style={{ animationDelay: "180ms", animationFillMode: "backwards" }}
      >
        {description}
      </p>

      <button
        onClick={onStartBooking}
        className="group mt-8 flex w-full animate-[fade-slide-up_420ms_ease-out] items-center justify-between rounded-full border border-ivory/10 bg-ivory px-5 py-3.5 text-felt-dark transition-all duration-300 hover:bg-brass active:scale-[0.98] light:border-felt-dark/10 light:bg-felt-dark light:text-ivory light:hover:text-felt-dark"
        style={{ animationDelay: "240ms", animationFillMode: "backwards" }}
      >
        <span className="ml-2 font-medium tracking-[-0.02em]">Start a booking</span>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-felt-dark text-ivory transition-transform duration-300 group-hover:translate-x-0.5 light:bg-ivory light:text-felt-dark">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" />
            <path d="m13 6 6 6-6 6" />
          </svg>
        </span>
      </button>
    </div>
  );
};

export default EmptyBookings;