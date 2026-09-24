type BookingBarProps = {
  label: string;
  subLabel?: string;
  disabled?: boolean;
  onPress: () => void;
};

/**
 * The persistent, one-hand-reachable primary action — intentionally
 * styled identically to the homepage's "Reserve your table" footer
 * button (same pill, same inverted icon circle, same hover/press
 * behaviour) so the booking flow reads as the same product.
 */
const BookingBar = ({ label, subLabel, disabled, onPress }: BookingBarProps) => {
  return (
    <div className="px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
      <button
        onClick={onPress}
        disabled={disabled}
        className="group flex w-full items-center justify-between rounded-full border border-ivory/10 bg-ivory px-5 py-3.5 text-felt-dark transition-all duration-300 hover:bg-brass active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 light:border-felt-dark/10 light:bg-felt-dark light:text-ivory light:hover:text-felt-dark"
      >
        <span className="ml-2 flex flex-col items-start leading-none">
          <span className="font-medium tracking-[-0.02em]">{label}</span>
          {subLabel && (
            <span className="mt-1 text-[11px] tracking-tighter opacity-60">{subLabel}</span>
          )}
        </span>

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

export default BookingBar;