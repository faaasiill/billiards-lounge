import { supabase } from "../../../lib/supabase";
import {
  DEFAULT_HOURS,
  toHm,
  type ClosureRange,
  type DayHours,
} from "../../../lib/clubHours";

export type ClubSchedule = {
  hours: DayHours[]; // always 7 entries
  closures: ClosureRange[];
  timeZone: string;
  slotIntervalMinutes: number;
  cleanupBufferMinutes: number;
  defaultDurationMinutes: number;
};

/**
 * Everything the booking flow needs to know about WHEN the club is open.
 * One round trip (3 parallel queries). Use with getDateOpenState() to grey out
 * dates in the calendar, and buildSlotCandidates() to generate slots.
 */
export const getClubSchedule = async (): Promise<{
  data: ClubSchedule | null;
  error: string | null;
}> => {
  const [hoursRes, closuresRes, settingsRes] = await Promise.all([
    supabase.from("club_hours").select("weekday, is_open, open_time, close_time"),
    supabase.from("club_closures").select("start_date, end_date"),
    supabase
      .from("club_settings")
      .select("slot_interval_minutes, cleanup_buffer_minutes, default_duration_minutes, timezone")
      .eq("id", 1)
      .single(),
  ]);

  if (hoursRes.error || closuresRes.error || settingsRes.error || !settingsRes.data) {
    return { data: null, error: "Couldn't load opening hours. Please try again." };
  }

  const byDay = new Map((hoursRes.data ?? []).map((r) => [r.weekday as number, r]));
  const hours: DayHours[] = DEFAULT_HOURS.map((fallback) => {
    const row = byDay.get(fallback.weekday);
    // A missing row is treated as CLOSED so we never sell slots for an unconfigured day.
    return row
      ? {
          weekday: fallback.weekday,
          is_open: row.is_open as boolean,
          open_time: toHm(row.open_time as string),
          close_time: toHm(row.close_time as string),
        }
      : { ...fallback, is_open: false };
  });

  const s = settingsRes.data;
  return {
    data: {
      hours,
      closures: (closuresRes.data ?? []) as ClosureRange[],
      timeZone: s.timezone ?? "Asia/Kolkata",
      slotIntervalMinutes: s.slot_interval_minutes,
      cleanupBufferMinutes: s.cleanup_buffer_minutes,
      defaultDurationMinutes: s.default_duration_minutes,
    },
    error: null,
  };
};