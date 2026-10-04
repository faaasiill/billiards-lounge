import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";

type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
};

const CLOSE_DURATION = 300;
const DRAG_CLOSE_THRESHOLD = 120;

/**
 * Generic bottom-drawer used for every secondary interaction in the
 * booking flow (customer details, review, and any future "more info"
 * sheets). Drag the handle down past the threshold, tap the backdrop,
 * or call `onClose` to dismiss. Timing/easing matches the Navbar
 * dropdown (300ms ease-out) so both feel like the same interaction
 * language.
 */
const BottomSheet = ({ open, onClose, title, children, footer }: BottomSheetProps) => {
  const [mounted, setMounted] = useState(open);
  /** Flips true one frame after mounting so the slide-in transition runs. */
  const [entered, setEntered] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dragY, setDragY] = useState(0);
  const startY = useRef(0);

  // Mount as soon as `open` turns true (adjusting state during render is the
  // supported alternative to setting it in an effect).
  if (open && !mounted) setMounted(true);

  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => setEntered(true));
      return () => cancelAnimationFrame(id);
    }

    // Keep the sheet mounted while it slides out, then unmount.
    const timeout = window.setTimeout(() => {
      setMounted(false);
      setEntered(false);
    }, CLOSE_DURATION);
    return () => window.clearTimeout(timeout);
  }, [open]);

  if (!mounted) return null;

  const visible = open && entered;

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    startY.current = e.clientY;
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    setDragY(Math.max(0, e.clientY - startY.current));
  };

  const endDrag = () => {
    if (!dragging) return;
    setDragging(false);
    if (dragY > DRAG_CLOSE_THRESHOLD) onClose();
    setDragY(0);
  };

  return (
    <>
      <button
        aria-label="Close sheet backdrop"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-felt-dark/60 transition-opacity duration-300 ease-out ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      />

      <div
        className={`fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-md rounded-t-4xl border border-b-0 border-ivory/10 bg-felt-dark shadow-lg shadow-black/40 transition-transform duration-300 ease-out light:border-felt-dark/10 light:bg-ivory ${
          visible ? "translate-y-0" : "translate-y-full"
        }`}
        style={
          dragging
            ? { transform: `translateY(${dragY}px)`, transition: "none" }
            : undefined
        }
      >
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className="flex cursor-grab touch-none flex-col items-center pb-2 pt-3 active:cursor-grabbing"
        >
          <span className="h-1.5 w-10 rounded-full bg-ivory/25 light:bg-felt-dark/20" />
        </div>

        {title && (
          <div className="flex items-center justify-between px-6 pb-2">
            <h2 className="font-display text-lg tracking-[-0.04em] text-ivory light:text-felt-dark">
              {title}
            </h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="flex h-8 w-8 items-center justify-center rounded-full text-ivory/50 transition-all duration-200 active:scale-90 active:bg-ivory/10 light:text-felt-dark/50 light:active:bg-felt-dark/10"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        <div className="max-h-[60vh] overflow-y-auto px-6">{children}</div>

        {footer && (
          <div className="px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">{footer}</div>
        )}
      </div>
    </>
  );
};

export default BottomSheet;