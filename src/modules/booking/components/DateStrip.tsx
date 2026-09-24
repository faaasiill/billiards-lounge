import { Fragment } from "react";
import type { DateOption } from "../types";

type DateStripProps = {
  dates: DateOption[];
  selectedId: string | null;
  onSelect: (date: DateOption) => void;
};

const DateStrip = ({ dates, selectedId, onSelect }: DateStripProps) => {
  return (
    <div
      className="-mx-1 flex items-center overflow-x-auto px-1 pb-2.5"
      style={{ scrollbarWidth: "none" }}
    >
      {dates.map((date, i) => {
        const selected = date.id === selectedId;

        return (
          <Fragment key={date.id}>
            {i > 0 && (
              <span className="h-3.5 w-px shrink-0 bg-ivory/10 light:bg-felt-dark/10" />
            )}

            <button
              onClick={() => onSelect(date)}
              className="flex w-1/4 shrink-0 flex-col items-center gap-1.5 px-1.5 py-1 outline-none transition-transform duration-200 active:scale-95"
            >
              <span className="text-[11px] tracking-tighter text-ivory/50 light:text-felt-dark/50">
                {date.isToday ? "Today" : date.dayLabel}
              </span>
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full font-display text-sm tracking-tight transition-colors duration-200 ${
                  selected
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