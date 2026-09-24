import { useEffect } from "react";
import { SETTLE_TRANSITION, useMorphTransition } from "./useMorphTransition";

type PlayersSelectorProps = {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
};

const MinusIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
    <path d="M5 12h14" />
  </svg>
);

const PlusIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const stepButtonClass =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ivory transition-all duration-200 active:scale-90 active:bg-ivory/10 disabled:pointer-events-none disabled:opacity-25 light:text-felt-dark light:active:bg-felt-dark/10";

/**
 * Compact ↔ expanded morph for party size. Compact keeps the original
 * minus / number / plus stepper. Expanded reveals every value between
 * min and max as tappable pills (a "person icon count" row would overload
 * this quickly, so plain numerals keep it legible), letting the user jump
 * straight to a count instead of stepping one at a time. Locked
 * activities (min === max) never expand — there's nothing to reveal.
 */
const PlayersSelector = ({ value, min, max, onChange }: PlayersSelectorProps) => {
  const locked = min === max;
  const morph = useMorphTransition();
  const { expanded, progress, transitionsOn, boxHeight, compactRef, expandedRef, settle, collapseAfterDelay, handleProps, reducedMotion } = morph;

  // A locked activity has nothing to expand into — keep it collapsed.
  useEffect(() => {
    if (locked) settle(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locked]);

  const decrement = () => onChange(Math.max(min, value - 1));
  const increment = () => onChange(Math.min(max, value + 1));

  const handlePick = (count: number) => {
    onChange(count);
    collapseAfterDelay(220);
  };

  const options = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <div className="w-full">
      <div
        className="relative overflow-hidden"
        style={{
          height: boxHeight,
          transition: transitionsOn ? `height ${SETTLE_TRANSITION}` : "none",
        }}
      >
        {/* Compact stepper */}
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
          <div className="flex items-center justify-between px-1">
            <span className="text-xs tracking-tighter text-ivory/55 light:text-felt-dark/55">
              {locked ? "Fixed party size" : `Choose between ${min} and ${max}`}
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={decrement}
                disabled={locked || value <= min}
                aria-label="Decrease players"
                className={stepButtonClass}
              >
                <MinusIcon />
              </button>

              <span className="w-4 text-center font-display text-lg leading-none tracking-[-0.04em] text-ivory light:text-felt-dark">
                {value}
              </span>

              <button
                type="button"
                onClick={increment}
                disabled={locked || value >= max}
                aria-label="Increase players"
                className={stepButtonClass}
              >
                <PlusIcon />
              </button>
            </div>
          </div>
        </div>

        {/* Expanded tap-to-pick row */}
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
          <span className="mb-3 block px-1 text-xs tracking-tighter text-ivory/55 light:text-felt-dark/55">
            Party size
          </span>

          <div className="flex flex-wrap gap-2 px-1">
            {options.map((count) => {
              const selected = count === value;

              return (
                <button
                  key={count}
                  type="button"
                  onClick={() => handlePick(count)}
                  aria-pressed={selected}
                  className={`flex h-11 min-w-11 items-center justify-center rounded-full px-3 font-display text-base tracking-[-0.02em] transition-all duration-200 active:scale-90 ${
                    selected
                      ? "bg-brass font-medium text-felt-dark"
                      : "text-ivory/80 active:bg-ivory/10 light:text-felt-dark/75 light:active:bg-felt-dark/10"
                  }`}
                >
                  {count}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Drag handle — hidden for locked activities, nothing to reveal */}
      {!locked && (
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
          aria-label={expanded ? "Collapse player picker" : "Pick an exact party size"}
          className="flex touch-none cursor-grab select-none items-center justify-center py-1.5 active:cursor-grabbing"
        >
          <span
            className={`h-1 rounded-full bg-ivory/20 light:bg-felt-dark/20 ${
              reducedMotion ? "" : "transition-all duration-300 ease-out"
            } ${expanded ? "w-6" : "w-10"}`}
          />
        </div>
      )}
    </div>
  );
};

export default PlayersSelector;