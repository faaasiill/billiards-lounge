import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

export const SETTLE_TRANSITION = "420ms cubic-bezier(0.34,1.56,0.64,1)";

const TOGGLE_THRESHOLD = 0.4;

/**
 * Drives the compact ↔ expanded morph shared by every selector in the
 * booking flow (date, time, duration, players, ...). Lifted out of
 * DateCalendar so every selector morphs the same container in place
 * instead of swapping components or popping a separate sheet.
 *
 * Consumers get back two refs (attach to the compact/expanded content so
 * their natural height can be measured), a `progress` value (0 = compact,
 * 1 = expanded) to drive opacity/scale/translate on each layer, and drag
 * handlers for an optional handle. `settle(target)` snaps directly to a
 * state (e.g. auto-collapsing after a selection).
 */
export const useMorphTransition = () => {
  const reducedMotion = useMemo(
    () =>
      typeof window !== "undefined" &&
      Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches),
    [],
  );

  const [expanded, setExpanded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);

  const [compactHeight, setCompactHeight] = useState(0);
  const [expandedHeight, setExpandedHeight] = useState(0);

  const compactRef = useRef<HTMLDivElement>(null);
  const expandedRef = useRef<HTMLDivElement>(null);

  const dragStartY = useRef(0);
  const dragStartProgress = useRef(0);
  const moved = useRef(false);
  const collapseTimer = useRef<ReturnType<typeof window.setTimeout> | null>(null);

  useLayoutEffect(() => {
    const element = compactRef.current;
    if (!element) return;

    const update = () => setCompactHeight(element.scrollHeight);
    update();

    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  });

  useLayoutEffect(() => {
    const element = expandedRef.current;
    if (!element) return;

    const update = () => setExpandedHeight(element.scrollHeight);
    update();

    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  });

  const transitionsOn = !dragging && !reducedMotion;
  const boxHeight = compactHeight + (expandedHeight - compactHeight) * progress;

  const settle = (target: 0 | 1) => {
    setExpanded(target === 1);
    setProgress(target);
  };

  const toggle = () => settle(expanded ? 0 : 1);

  /** Call after a selection is made; auto-collapses if currently expanded. */
  const collapseAfterDelay = (delayMs = 260) => {
    if (!expanded) return;
    if (collapseTimer.current) window.clearTimeout(collapseTimer.current);
    collapseTimer.current = window.setTimeout(() => settle(0), delayMs);
  };

  const onHandlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    if (collapseTimer.current) window.clearTimeout(collapseTimer.current);

    setDragging(true);
    moved.current = false;
    dragStartY.current = e.clientY;
    dragStartProgress.current = progress;
  };

  const onHandlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging) return;

    const distance = e.clientY - dragStartY.current;
    if (Math.abs(distance) > 4) moved.current = true;

    const range = Math.max(1, expandedHeight - compactHeight);
    const next = Math.min(1, Math.max(0, dragStartProgress.current + distance / range));
    setProgress(next);
  };

  const endDrag = () => {
    if (!dragging) return;
    setDragging(false);

    if (!moved.current) {
      settle(expanded ? 0 : 1);
      return;
    }

    settle(progress > TOGGLE_THRESHOLD ? 1 : 0);
  };

  return {
    expanded,
    progress,
    dragging,
    transitionsOn,
    boxHeight,
    compactRef,
    expandedRef,
    settle,
    toggle,
    collapseAfterDelay,
    handleProps: {
      onPointerDown: onHandlePointerDown,
      onPointerMove: onHandlePointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
    },
    reducedMotion,
  };
};