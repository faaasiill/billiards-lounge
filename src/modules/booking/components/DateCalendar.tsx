import { useMemo, useState } from "react";

import DateStrip from "./DateStrip";
import { useMorphTransition, SETTLE_TRANSITION } from "./useMorphTransition";

import { buildDateOptionsFrom, buildMonthGrid } from "../mockData";

import type { DateOption } from "../types";

type DateCalendarProps = {
  selectedId: string | null;
  onSelect: (date: DateOption) => void;
};

const COMPACT_COUNT = 14;
const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const MAX_MONTHS_AHEAD = 6;

const startOfDay = (date: Date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);

const addMonths = (date: Date, amount: number) =>
  new Date(date.getFullYear(), date.getMonth() + amount, 1);

const sameMonth = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

const ChevronLeft = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m15 6-6 6 6 6" />
  </svg>
);

const ChevronRight = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m9 6 6 6-6 6" />
  </svg>
);

const navBtnClass =
  "flex h-8 w-8 items-center justify-center rounded-full text-ivory/70 transition-all duration-200 active:scale-90 active:bg-ivory/10 disabled:pointer-events-none disabled:opacity-25 light:text-felt-dark/70 light:active:bg-felt-dark/10";

const DateCalendar = ({ selectedId, onSelect }: DateCalendarProps) => {
  const today = useMemo(() => startOfDay(new Date()), []);
  const maxMonth = useMemo(() => addMonths(startOfMonth(today), MAX_MONTHS_AHEAD), [today]);

  const [compactAnchor, setCompactAnchor] = useState(today);
  const [monthAnchor, setMonthAnchor] = useState(startOfMonth(today));

  const morph = useMorphTransition();
  const {
    expanded,
    progress,
    transitionsOn,
    boxHeight,
    compactRef,
    expandedRef,
    settle,
    collapseAfterDelay,
    handleProps,
    reducedMotion,
  } = morph;

  const compactDates = useMemo(() => buildDateOptionsFrom(compactAnchor, COMPACT_COUNT), [compactAnchor]);
  const monthGrid = useMemo(() => buildMonthGrid(monthAnchor), [monthAnchor]);

  const handleSelect = (date: DateOption) => {
    onSelect(date);

    const inCompactRange = compactDates.some((item) => item.id === date.id);
    if (!inCompactRange) setCompactAnchor(date.date);

    if (!sameMonth(date.date, monthAnchor)) setMonthAnchor(startOfMonth(date.date));

    collapseAfterDelay(260);
  };

  const canGoPrev = monthAnchor.getTime() > startOfMonth(today).getTime();
  const canGoNext = monthAnchor.getTime() < maxMonth.getTime();

  return (
    <div className="w-full">
      <div
        className="relative overflow-hidden"
        style={{
          height: boxHeight,
          transition: transitionsOn ? `height ${SETTLE_TRANSITION}` : "none",
        }}
      >
        {/* Compact strip */}
        <div
          ref={compactRef}
          className="absolute inset-x-0 top-0"
          style={{
            opacity: 1 - progress,
            transform: `translateY(${-progress * 8}px) scale(${1 - progress * 0.025})`,
            transition: transitionsOn
              ? `opacity ${SETTLE_TRANSITION}, transform ${SETTLE_TRANSITION}`
              : "none",
            pointerEvents: progress < 0.5 ? "auto" : "none",
          }}
        >
          <DateStrip dates={compactDates} selectedId={selectedId} onSelect={handleSelect} />
        </div>

        {/* Expanded month calendar */}
        <div
          ref={expandedRef}
          className="absolute inset-x-0 top-0"
          style={{
            opacity: progress,
            transform: `translateY(${(1 - progress) * 8}px) scale(${0.975 + progress * 0.025})`,
            transition: transitionsOn
              ? `opacity ${SETTLE_TRANSITION}, transform ${SETTLE_TRANSITION}`
              : "none",
            pointerEvents: progress >= 0.5 ? "auto" : "none",
          }}
        >
          <div className="mb-4 flex items-center justify-between px-1">
            <button
              type="button"
              onClick={() => setMonthAnchor((month) => addMonths(month, -1))}
              disabled={!canGoPrev}
              aria-label="Previous month"
              className={navBtnClass}
            >
              <ChevronLeft />
            </button>

            <span className="font-display text-sm tracking-[-0.02em] text-ivory light:text-felt-dark">
              {monthGrid.label}
            </span>

            <button
              type="button"
              onClick={() => setMonthAnchor((month) => addMonths(month, 1))}
              disabled={!canGoNext}
              aria-label="Next month"
              className={navBtnClass}
            >
              <ChevronRight />
            </button>
          </div>

          <div className="mb-2 grid grid-cols-7">
            {WEEKDAY_LABELS.map((label, index) => (
              <span
                key={`${label}-${index}`}
                className="text-center text-[10px] font-medium tracking-tight text-ivory/35 light:text-felt-dark/35"
              >
                {label}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-1">
            {monthGrid.weeks.flatMap((week, weekIndex) =>
              week.map((day, dayIndex) => {
                if (!day) {
                  return <span key={`${weekIndex}-${dayIndex}`} className="h-10" />;
                }

                const selected = day.id === selectedId;
                const isPast = day.date.getTime() < today.getTime();
                const isToday = day.date.getTime() === today.getTime();

                return (
                  <button
                    key={day.id}
                    type="button"
                    disabled={isPast}
                    onClick={() => handleSelect(day)}
                    aria-label={`Select ${day.dayNumber}`}
                    aria-pressed={selected}
                    className="flex h-10 items-center justify-center"
                  >
                    <span
                      className={`relative flex h-9 w-9 items-center justify-center rounded-full text-sm tracking-tight transition-all duration-200 active:scale-90 ${
                        isPast
                          ? "text-ivory/20 light:text-felt-dark/20"
                          : selected
                            ? "bg-brass font-medium text-felt-dark"
                            : "text-ivory/85 hover:bg-ivory/5 active:bg-ivory/10 light:text-felt-dark/80 light:hover:bg-felt-dark/5 light:active:bg-felt-dark/10"
                      }`}
                    >
                      {day.dayNumber}
                      {isToday && !selected && (
                        <span className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-brass" />
                      )}
                    </span>
                  </button>
                );
              }),
            )}
          </div>
        </div>
      </div>

      {/* Drag handle */}
      <div
        {...handleProps}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            settle(expanded ? 0 : 1);
          }
        }}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        aria-label={expanded ? "Collapse calendar" : "Expand calendar to see the full month"}
        className="flex touch-none cursor-grab select-none items-center justify-center py-1.5 active:cursor-grabbing"
      >
        <span
          className={`h-1 rounded-full bg-ivory/20 light:bg-felt-dark/20 ${
            reducedMotion ? "" : "transition-all duration-300 ease-out"
          } ${expanded ? "w-6" : "w-10"}`}
        />
      </div>
    </div>
  );
};

export default DateCalendar;