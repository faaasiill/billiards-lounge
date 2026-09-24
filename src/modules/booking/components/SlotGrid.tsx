import { useEffect, useMemo } from "react";
import StateCard, { ClockIcon } from "./StateCard";
import { SETTLE_TRANSITION, useMorphTransition } from "./useMorphTransition";
import type { TimeSlot } from "../types";

type SlotGridProps = {
  slots: TimeSlot[];
  selectedId: string | null;
  onSelect: (slot: TimeSlot) => void;
};

const COMPACT_COUNT = 3;

const slotButtonClass = (state: "disabled" | "selected" | "idle") =>
  `relative flex min-h-[58px] flex-col items-center justify-center gap-0.5 rounded-full py-3 text-sm tracking-tight transition-all duration-200 ${
    state === "disabled"
      ? "cursor-not-allowed text-ivory/25 line-through light:text-felt-dark/25"
      : state === "selected"
        ? "bg-brass font-medium text-felt-dark active:scale-95"
        : "text-ivory/80 active:scale-95 active:bg-ivory/10 light:text-felt-dark/75 light:active:bg-felt-dark/10"
  }`;

const SlotButton = ({
  slot,
  selected,
  onSelect,
}: {
  slot: TimeSlot;
  selected: boolean;
  onSelect: (slot: TimeSlot) => void;
}) => {
  const disabled = !slot.available;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(slot)}
      className={slotButtonClass(disabled ? "disabled" : selected ? "selected" : "idle")}
    >
      {slot.isPeak && !disabled && (
        <span
          className={`absolute right-3 top-2.5 h-1.5 w-1.5 rounded-full ${
            selected ? "bg-felt-dark/40" : "bg-brass"
          }`}
        />
      )}
      <span>{slot.label}</span>
      {slot.isPeak && !disabled && (
        <span className={`text-[10px] tracking-tighter ${selected ? "text-felt-dark/70" : "text-brass"}`}>
          Peak
        </span>
      )}
    </button>
  );
};

/**
 * Compact ↔ expanded morph for time slots, matching the date picker's
 * interaction language: a 3-up preview row of the nearest slots (auto-
 * centred on whichever is selected) morphs in place into the full grid.
 */
const SlotGrid = ({ slots, selectedId, onSelect }: SlotGridProps) => {
  const morph = useMorphTransition();
  const { expanded, progress, transitionsOn, boxHeight, compactRef, expandedRef, settle, collapseAfterDelay, handleProps, reducedMotion } = morph;

  const availableSlots = useMemo(() => slots.filter((s) => s.available), [slots]);

  const compactSlots = useMemo(() => {
    if (slots.length === 0) return [];

    const selectedIndex = slots.findIndex((s) => s.id === selectedId);
    if (selectedIndex === -1) {
      return (availableSlots.length > 0 ? availableSlots : slots).slice(0, COMPACT_COUNT);
    }

    // Centre the compact preview on the selected slot where possible.
    const half = Math.floor(COMPACT_COUNT / 2);
    let start = selectedIndex - half;
    start = Math.max(0, Math.min(start, slots.length - COMPACT_COUNT));
    return slots.slice(start, start + COMPACT_COUNT);
  }, [slots, selectedId, availableSlots]);

  // Collapse back to the 3-up preview if the activity/date changes.
  useEffect(() => {
    settle(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots]);

  const handleSelect = (slot: TimeSlot) => {
    onSelect(slot);
    collapseAfterDelay(260);
  };

  if (slots.length === 0) {
    return (
      <StateCard
        compact
        icon={<ClockIcon />}
        title="No times available"
        description="Try another day or a shorter duration."
      />
    );
  }

  return (
    <div className="w-full">
      <div
        className="relative overflow-hidden"
        style={{
          height: boxHeight,
          transition: transitionsOn ? `height ${SETTLE_TRANSITION}` : "none",
        }}
      >
        {/* Compact 3-up preview */}
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
          <div className="grid grid-cols-3 gap-2">
            {compactSlots.map((slot) => (
              <SlotButton key={slot.id} slot={slot} selected={slot.id === selectedId} onSelect={handleSelect} />
            ))}
          </div>
        </div>

        {/* Expanded full grid */}
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
          <div className="grid grid-cols-3 gap-2">
            {slots.map((slot) => (
              <SlotButton key={slot.id} slot={slot} selected={slot.id === selectedId} onSelect={handleSelect} />
            ))}
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
        aria-label={expanded ? "Collapse time slots" : "See all available times"}
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

export default SlotGrid;