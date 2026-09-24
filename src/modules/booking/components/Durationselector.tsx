import { Fragment } from "react";
import { SETTLE_TRANSITION, useMorphTransition } from "./useMorphTransition";
import type { DurationOption } from "../types";

type DurationSelectorProps = {
  durations: DurationOption[];
  selectedId: string | null;
  onSelect: (duration: DurationOption) => void;
};

const CheckIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

// Strips a trailing price fragment (e.g. "60 mins · ₹500" -> "60 mins")
// in case it's baked into the label upstream, plus any dangling separator.
const stripPrice = (label: string) =>
  label.replace(/[₹$€][\s\d,.]*$/, "").replace(/[\s·|/-]+$/, "").trim();

const bumpKeyframes = `
  @keyframes duration-pill-bump {
    0%   { transform: scale(1); }
    35%  { transform: scale(1.07); }
    65%  { transform: scale(0.98); }
    100% { transform: scale(1); }
  }
  @keyframes duration-check-spring {
    0%   { transform: scale(0) rotate(-50deg); opacity: 0; }
    55%  { transform: scale(1.3) rotate(10deg); opacity: 1; }
    75%  { transform: scale(0.9) rotate(-4deg); }
    100% { transform: scale(1) rotate(0deg); opacity: 1; }
  }
  @keyframes duration-label-shift {
    0%   { transform: translateX(-6px); }
    100% { transform: translateX(0); }
  }
`;

/**
 * Compact ↔ expanded morph for the duration picker. Compact mirrors the
 * original equal-width pill row; expanded stacks the same options as
 * fuller rows with the price made explicit, so touching/dragging the
 * handle reveals more detail rather than swapping to a different control.
 * The selected pill's bump/check/label micro-animations are preserved in
 * both states so the choice stays visually anchored through the morph.
 */
const DurationSelector = ({ durations, selectedId, onSelect }: DurationSelectorProps) => {
  const morph = useMorphTransition();
  const { expanded, progress, transitionsOn, boxHeight, compactRef, expandedRef, settle, collapseAfterDelay, handleProps, reducedMotion } = morph;

  const handleSelect = (duration: DurationOption) => {
    onSelect(duration);
    collapseAfterDelay(220);
  };

  return (
    <div className="w-full">
      <style>{bumpKeyframes}</style>

      <div
        className="relative overflow-hidden"
        style={{
          height: boxHeight,
          transition: transitionsOn ? `height ${SETTLE_TRANSITION}` : "none",
        }}
      >
        {/* Compact pill row */}
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
          <div className="flex items-center gap-2">
            {durations.map((duration, i) => {
              const selected = duration.id === selectedId;
              const label = stripPrice(duration.label);

              return (
                <Fragment key={duration.id}>
                  {i > 0 && <span className="h-5 w-px shrink-0 bg-ivory/10 light:bg-felt-dark/10" />}

                  <button
                    key={selected ? `${duration.id}-selected` : duration.id}
                    onClick={() => handleSelect(duration)}
                    style={selected ? { animation: "duration-pill-bump 420ms cubic-bezier(0.34,1.56,0.64,1)" } : undefined}
                    className={`flex flex-1 items-center justify-center rounded-full py-3.5 text-sm tracking-tight transition-colors duration-200 active:scale-95 ${
                      selected
                        ? "bg-brass font-medium text-felt-dark"
                        : "text-ivory/75 active:bg-ivory/10 light:text-felt-dark/70 light:active:bg-felt-dark/10"
                    }`}
                  >
                    {selected && (
                      <span
                        style={{ animation: "duration-check-spring 480ms cubic-bezier(0.34,1.56,0.64,1) both" }}
                        className="mr-1 inline-flex items-center justify-center"
                      >
                        <CheckIcon />
                      </span>
                    )}
                    <span style={selected ? { animation: "duration-label-shift 300ms ease-out" } : undefined} className="inline-block">
                      {label}
                    </span>
                  </button>
                </Fragment>
              );
            })}
          </div>
        </div>

        {/* Expanded detailed rows */}
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
          <div className="flex flex-col gap-2">
            {durations.map((duration) => {
              const selected = duration.id === selectedId;
              const label = stripPrice(duration.label);

              return (
                <button
                  key={selected ? `${duration.id}-selected-full` : `${duration.id}-full`}
                  onClick={() => handleSelect(duration)}
                  style={selected ? { animation: "duration-pill-bump 420ms cubic-bezier(0.34,1.56,0.64,1)" } : undefined}
                  className={`flex items-center justify-between rounded-full px-5 py-3.5 text-sm tracking-tight transition-colors duration-200 active:scale-[0.98] ${
                    selected
                      ? "bg-brass font-medium text-felt-dark"
                      : "text-ivory/75 active:bg-ivory/10 light:text-felt-dark/70 light:active:bg-felt-dark/10"
                  }`}
                >
                  <span className="flex items-center">
                    {selected && (
                      <span
                        style={{ animation: "duration-check-spring 480ms cubic-bezier(0.34,1.56,0.64,1) both" }}
                        className="mr-1.5 inline-flex items-center justify-center"
                      >
                        <CheckIcon />
                      </span>
                    )}
                    <span style={selected ? { animation: "duration-label-shift 300ms ease-out" } : undefined} className="inline-block">
                      {label}
                    </span>
                  </span>

                  <span className={`text-xs tracking-tighter ${selected ? "text-felt-dark/70" : "text-ivory/45 light:text-felt-dark/45"}`}>
                    ₹{duration.price}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Drag handle — same affordance as the date picker */}
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
        aria-label={expanded ? "Collapse duration options" : "See duration prices"}
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

export default DurationSelector;