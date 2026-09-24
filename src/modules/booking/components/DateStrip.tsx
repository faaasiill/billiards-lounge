import { Fragment, useEffect, useRef } from "react";
import type { DateOption } from "../types";

type DateStripProps = {
  dates: DateOption[];
  selectedId: string | null;
  onSelect: (date: DateOption) => void;
  /** Returns true when the club is closed on this date. */
  isDisabled?: (date: DateOption) => boolean;
};

const DateStrip = ({ dates, selectedId, onSelect, isDisabled }: DateStripProps) => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Keep the selected date centred in view whenever it changes (including
  // the automatic pick of the first open day).
  useEffect(() => {
    if (!selectedId) return;
    const scroller = scrollerRef.current;
    const item = itemRefs.current[selectedId];
    if (!scroller || !item) return;

    const target = item.offsetLeft - scroller.clientWidth / 2 + item.clientWidth / 2;
    scroller.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
  }, [selectedId, dates]);

  return (
    <div
      ref={scrollerRef}
      className="-mx-1 flex snap-x items-center overflow-x-auto px-1 pb-2.5"
      style={{ scrollbarWidth: "none" }}
    >
      {dates.map((date, i) => {
        const selected = date.id === selectedId;
        const disabled = isDisabled?.(date) ?? false;

        return (
          <Fragment key={date.id}>
            {i > 0 && <span className="h-3.5 w-px shrink-0 bg-ivory/10 light:bg-felt-dark/10" />}

            <button
              ref={(el) => {
                itemRefs.current[date.id] = el;
              }}
              type="button"
              disabled={disabled}
              aria-disabled={disabled}
              aria-pressed={selected}
              title={disabled ? "Closed" : undefined}
              onClick={() => onSelect(date)}
              className={`flex w-1/4 shrink-0 snap-center flex-col items-center gap-1.5 px-1.5 py-1 outline-none transition-transform duration-200 ${
                disabled ? "cursor-not-allowed" : "active:scale-95"
              }`}
            >
              <span
                className={`text-[11px] tracking-tighter ${
                  disabled
                    ? "text-ivory/20 light:text-felt-dark/20"
                    : "text-ivory/50 light:text-felt-dark/50"
                }`}
              >
                {date.isToday ? "Today" : date.dayLabel}
              </span>
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full font-display text-sm tracking-tight transition-colors duration-200 ${
                  disabled
                    ? "text-ivory/20 line-through decoration-ivory/25 light:text-felt-dark/20 light:decoration-felt-dark/25"
                    : selected
                      ? "bg-brass text-felt-dark"
                      : "text-ivory/85 light:text-felt-dark/80"
                }`}
              >
                {date.dayNumber}
              </span>
            </button>
          </Fragment>
        );
      })}
    </div>
  );
};

export default DateStrip;