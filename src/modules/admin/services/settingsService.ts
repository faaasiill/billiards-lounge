import { supabase } from "../../../lib/supabase";
import {
  WEEKDAY_NAMES,
  DEFAULT_HOURS,
  toHm,
  toMinutes,
  type DayHours,
} from "../../../lib/clubHours";

/* ------------------------------------------------------------------ */
/*  Global settings (buffer + default duration)                        */
/* ------------------------------------------------------------------ */

export type ClubSettingsRecord = {
  cleanup_buffer_minutes: number;
  default_duration_minutes: number;
  updated_at: string;
};

export type ClubSettingsInput = {
  cleanup_buffer_minutes: number;
  default_duration_minutes: number;
};

const toMessage = (raw: string | undefined): string =>
  raw ? "Something went wrong. Please try again." : "Something went wrong. Please try again.";

export const getClubSettings = async (): Promise<{
  data: ClubSettingsRecord | null;
  error: string | null;
}> => {
  const { data, error } = await supabase
    .from("club_settings")
    .select("cleanup_buffer_minutes, default_duration_minutes, updated_at")
    .eq("id", 1)
    .single();

  if (error || !data) return { data: null, error: "Couldn't load settings. Please try again." };

  return {
    data: {
      cleanup_buffer_minutes: data.cleanup_buffer_minutes,
      default_duration_minutes: data.default_duration_minutes,
      updated_at: data.updated_at,
    },
    error: null,
  };
};

export const updateClubSettings = async (
  input: ClubSettingsInput,
): Promise<{ error: string | null }> => {
  const { data: auth } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("club_settings")
    .update({
      cleanup_buffer_minutes: input.cleanup_buffer_minutes,
      default_duration_minutes: input.default_duration_minutes,
      updated_by: auth.user?.id ?? null,
    })
    .eq("id", 1);

  return { error: error ? toMessage(error.message) : null };
};

/* ------------------------------------------------------------------ */
/*  Per-day opening hours                                              */
/* ------------------------------------------------------------------ */

export const getClubHours = async (): Promise<{ data: DayHours[]; error: string | null }> => {
  const { data, error } = await supabase
    .from("club_hours")
    .select("weekday, is_open, open_time, close_time")
    .order("weekday", { ascending: true });

  if (error) {
    return { data: DEFAULT_HOURS, error: "Couldn't load opening hours. Please try again." };
  }

  // Guarantee all 7 days exist even if a row is missing.
  const byDay = new Map((data ?? []).map((r) => [r.weekday as number, r]));

  const full: DayHours[] = DEFAULT_HOURS.map((fallback) => {
    const row = byDay.get(fallback.weekday);
    return row
      ? {
          weekday: fallback.weekday,
          is_open: row.is_open as boolean,
          open_time: toHm(row.open_time as string),
          close_time: toHm(row.close_time as string),
        }
      : fallback;
  });

  return { data: full, error: null };
};

export const updateClubHours = async (hours: DayHours[]): Promise<{ error: string | null }> => {
  for (const h of hours) {
    if (h.is_open && toMinutes(h.open_time) === toMinutes(h.close_time)) {
      return {
        error: `${WEEKDAY_NAMES[h.weekday]}: opening and closing time can't be the same.`,
      };
    }
  }

  const { data: auth } = await supabase.auth.getUser();
  const now = new Date().toISOString();

  const { error } = await supabase.from("club_hours").upsert(
    hours.map((h) => ({
      weekday: h.weekday,
      is_open: h.is_open,
      open_time: h.open_time,
      close_time: h.close_time,
      updated_at: now,
      updated_by: auth.user?.id ?? null,
    })),
    { onConflict: "weekday" },
  );

  return { error: error ? toMessage(error.message) : null };
};

/* ------------------------------------------------------------------ */
/*  Closures (unchanged)                                               */
/* ------------------------------------------------------------------ */

export type ClubClosure = {
  id: string;
  start_date: string; // yyyy-mm-dd
  end_date: string;
  reason: string;
  kind: "holiday" | "leave";
};

export const listClosures = async (): Promise<{ data: ClubClosure[]; error: string | null }> => {
  const { data, error } = await supabase
    .from("club_closures")
    .select("id, start_date, end_date, reason, kind")
    .order("start_date", { ascending: true });

  if (error) return { data: [], error: "Couldn't load closures. Please try again." };
  return { data: (data ?? []) as ClubClosure[], error: null };
};

export type ClosureInput = {
  start_date: string;
  end_date: string;
  reason: string;
  kind: "holiday" | "leave";
};

export const addClosure = async (input: ClosureInput): Promise<{ error: string | null }> => {
  if (input.end_date < input.start_date) {
    return { error: "End date must be on or after the start date." };
  }

  const { data: auth } = await supabase.auth.getUser();

  const { error } = await supabase.from("club_closures").insert({
    start_date: input.start_date,
    end_date: input.end_date,
    reason: input.reason.trim(),
    kind: input.kind,
    created_by: auth.user?.id ?? null,
  });

  return { error: error ? toMessage(error.message) : null };
};

export const removeClosure = async (id: string): Promise<{ error: string | null }> => {
  const { error } = await supabase.from("club_closures").delete().eq("id", id);
  return { error: error ? toMessage(error.message) : null };
};