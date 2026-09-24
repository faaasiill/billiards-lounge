import { useEffect, useState } from "react";

/** Returns the current timestamp and re-renders on an interval so time badges stay fresh. */
export const useNow = (intervalMs = 30_000): number => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return now;
};