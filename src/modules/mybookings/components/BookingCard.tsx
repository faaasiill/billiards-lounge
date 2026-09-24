import { SETTLE_TRANSITION, useMorphTransition } from "../../booking/components/useMorphTransition";
import type { Booking } from "../../booking/types";

type BookingCardProps = {
  booking: Booking;
  delayMs?: number;
};

const ChevronDown = ({ expanded }: { expanded: boolean }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="transition-transform duration-300 ease-out"
    style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between py-2.5">
    <span className="text-xs tracking-tighter text-ivory/55 light:text-felt-dark/55">{label}</span>
    <span className="text-sm font-medium tracking-tight text-ivory light:text-felt-dark">{value}</span>
  </div>
);

const IMAGE_COMPACT_SIZE = 64; // px — matches the original h-16 w-16 thumbnail
const IMAGE_EXPANDED_HEIGHT = 288; // px — h-72, closer to the schedule-stage hero's h-90 for a properly prominent banner
const IMAGE_COMPACT_RADIUS = 20; // px — 1.25rem, matches the original thumbnail's rounding
const IMAGE_EXPANDED_RADIUS = 28; // px — rounded-4xl, the app's "expanded card" ceiling

/**
 * One booking's summary card. The activity photo itself is the morph
 * target: at rest it's a small rounded thumbnail sitting beside the
 * activity name; tapping the card grows that same image in place into a
 * full-width, rounded-4xl hero banner (mirroring the schedule-stage hero
 * and ActivityList's photo cards), while the name/date text reflows
 * beneath it and the extra detail rows fade in — all driven by the same
 * progress value from useMorphTransition, so it reads as one continuous
 * expansion rather than two unrelated animations.
 */
const BookingCard = ({ booking, delayMs = 0 }: BookingCardProps) => {
  const morph = useMorphTransition();
  const { expanded, progress, transitionsOn, boxHeight, compactRef, expandedRef, toggle, handleProps, reducedMotion } = morph;

  const imageHeight = IMAGE_COMPACT_SIZE + (IMAGE_EXPANDED_HEIGHT - IMAGE_COMPACT_SIZE) * progress;
  const imageRadius = IMAGE_COMPACT_RADIUS + (IMAGE_EXPANDED_RADIUS - IMAGE_COMPACT_RADIUS) * progress;

  return (
    <div
      className="mb-5 animate-[fade-slide-up_420ms_ease-out] overflow-hidden rounded-4xl border border-ivory/10 bg-ivory/5 light:border-felt-dark/10 light:bg-felt-dark/5"
      style={{ animationDelay: `${delayMs}ms`, animationFillMode: "backwards" }}
    >
      {/* Header — always visible, tappable to toggle. Layout itself
          morphs from a horizontal thumbnail+text row (progress 0) into a
          stacked hero-image-then-text layout (progress 1) by animating
          padding/gap via inline styles driven by progress, so the
          image's growth and the text's reflow happen together. */}
      <button
        onClick={toggle}
        aria-expanded={expanded}
        className="flex w-full flex-col text-left transition-colors duration-200 active:bg-ivory/5 light:active:bg-felt-dark/5"
        style={{
          padding: `${14 - progress}px`,
          gap: `${14 - progress * 2}px`,
          transition: transitionsOn ? `padding ${SETTLE_TRANSITION}, gap ${SETTLE_TRANSITION}` : "none",
        }}
      >
        <div
          className="flex w-full items-center"
          style={{
            gap: `${14 - progress * 14}px`,
            transition: transitionsOn ? `gap ${SETTLE_TRANSITION}` : "none",
          }}
        >
          {/* The morphing image itself — same element throughout, just
              growing in height/width/radius, never swapped or unmounted. */}
          <div
            className="relative shrink-0 overflow-hidden bg-cover bg-center"
            style={{
              width: progress > 0 ? `${100 * progress}%` : IMAGE_COMPACT_SIZE,
              flexBasis: progress > 0 ? "100%" : IMAGE_COMPACT_SIZE,
              height: imageHeight,
              borderRadius: imageRadius,
              backgroundImage: `url(${booking.activity.image})`,
              transition: transitionsOn
                ? `height ${SETTLE_TRANSITION}, width ${SETTLE_TRANSITION}, flex-basis ${SETTLE_TRANSITION}, border-radius ${SETTLE_TRANSITION}`
                : "none",
            }}
          >
            {/* Bottom scrim + overlaid name/date, matching the schedule
                hero and ActivityList's photo-card treatment — fades in
                only once the image is meaningfully expanded. */}
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0"
              style={{
                height: "70%",
                opacity: progress,
                background: "linear-gradient(to top, rgba(11,36,28,0.92), rgba(11,36,28,0))",
                transition: transitionsOn ? `opacity ${SETTLE_TRANSITION}` : "none",
              }}
            />
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col p-4"
              style={{
                opacity: progress,
                transform: `translateY(${(1 - progress) * 6}px)`,
                transition: transitionsOn
                  ? `opacity ${SETTLE_TRANSITION}, transform ${SETTLE_TRANSITION}`
                  : "none",
              }}
            >
              <span className="font-display text-lg leading-none tracking-[-0.05em] text-ivory">
                {booking.activity.name}
              </span>
              <span className="mt-1 text-xs tracking-tight text-ivory/80">{booking.activity.tagline}</span>
            </div>
          </div>

          {/* Compact-only text + price, fades out as the image expands
              and text reflows below it instead. */}
          <div
            className="flex min-w-0 flex-1 items-center"
            style={{
              opacity: 1 - progress,
              transition: transitionsOn ? `opacity ${SETTLE_TRANSITION}` : "none",
              pointerEvents: progress < 0.5 ? "auto" : "none",
            }}
          >
            <div className="min-w-0 flex-1">
              <span className="block truncate font-display text-base tracking-[-0.04em] text-ivory light:text-felt-dark">
                {booking.activity.name}
              </span>
              <span className="mt-0.5 block truncate text-xs tracking-tight text-ivory/55 light:text-felt-dark/55">
                {booking.date.dayLabel}, {booking.date.dayNumber} {booking.date.monthLabel} · {booking.slot.label}
              </span>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-1.5 pl-3">
              <span className="font-display text-sm tracking-[-0.02em] text-brass">₹{booking.total}</span>
              <span className="flex h-6 w-6 items-center justify-center rounded-full text-ivory/50 light:text-felt-dark/50">
                <ChevronDown expanded={expanded} />
              </span>
            </div>
          </div>
        </div>

        {/* Expanded-only summary line beneath the now full-width image —
            keeps the date/time/price connected to the booking once the
            compact row above has faded out. */}
        <div
          className="flex w-full items-baseline justify-between overflow-hidden"
          style={{
            opacity: progress,
            maxHeight: progress > 0 ? 40 : 0,
            transition: transitionsOn
              ? `opacity ${SETTLE_TRANSITION}, max-height ${SETTLE_TRANSITION}`
              : "none",
          }}
        >
          <span className="text-xs tracking-tighter text-ivory/55 light:text-felt-dark/55">
            {booking.date.dayLabel}, {booking.date.dayNumber} {booking.date.monthLabel} · {booking.slot.label}
          </span>
          <span className="font-display text-sm tracking-[-0.02em] text-brass">₹{booking.total}</span>
        </div>
      </button>

      {/* Morphing detail container */}
      <div
        className="relative overflow-hidden px-3.5"
        style={{
          height: expanded || progress > 0 ? boxHeight : 0,
          transition: transitionsOn ? `height ${SETTLE_TRANSITION}` : "none",
        }}
      >
        <div ref={compactRef} className="absolute inset-x-3.5 top-0 h-px" aria-hidden="true" />

        <div
          ref={expandedRef}
          className="absolute inset-x-3.5 top-0"
          style={{
            opacity: progress,
            transform: `translateY(${(1 - progress) * 8}px) scale(${0.975 + progress * 0.025})`,
            transition: transitionsOn
              ? `opacity ${SETTLE_TRANSITION}, transform ${SETTLE_TRANSITION}`
              : "none",
            pointerEvents: progress >= 0.5 ? "auto" : "none",
          }}
        >
          <div className="flex flex-col divide-y divide-ivory/10 border-t border-ivory/10 pb-3.5 light:divide-felt-dark/10 light:border-felt-dark/10">
            <DetailRow label="Duration" value={booking.duration.label} />
            <DetailRow label="Players" value={`${booking.players} ${booking.players === 1 ? "player" : "players"}`} />
            <DetailRow label="Booked for" value={booking.customer.name} />
            <DetailRow label="Total paid" value={`₹${booking.total}`} />
            <DetailRow label="Booking ID" value={`#${booking.id}`} />
          </div>
        </div>
      </div>

      {/* Drag handle — same affordance as the booking flow's selectors */}
      <div
        {...handleProps}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggle();
          }
        }}
        role="button"
        tabIndex={-1}
        aria-hidden="true"
        className="flex touch-none cursor-grab select-none items-center justify-center pb-2.5 pt-0.5 active:cursor-grabbing"
      >
        <span
          className={`h-1 rounded-full bg-ivory/15 light:bg-felt-dark/15 ${
            reducedMotion ? "" : "transition-all duration-300 ease-out"
          } ${expanded ? "w-6" : "w-8"}`}
        />
      </div>
    </div>
  );
};

export default BookingCard;