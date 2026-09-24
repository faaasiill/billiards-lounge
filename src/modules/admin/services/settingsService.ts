import { supabase } from "../../../lib/supabase";

export type ClubSettingsRecord = {
  open_time: string; // "HH:MM:SS" or "HH:MM" as returned by Postgres `time`
  close_time: string;
  weekly_off_days: number[]; // 0=Sun..6=Sat
  cleanup_buffer_minutes: number;
  default_duration_minutes: number;
  updated_at: string;
};

export type ClubClosure = {
  id: string;
  start_date: string; // yyyy-mm-dd
  end_date: string;
  reason: string;
  kind: "holiday" | "leave";
};

const toMessage = (raw: string | undefined): string =>
  raw ? "Something went wrong. Please try again." : "Something went wrong. Please try again.";

/** Normalizes a Postgres `time` value ("10:00:00") to "HH:MM" for <input type="time">. */
const toHm = (value: string) => value.slice(0, 5);

export const getClubSettings = async (): Promise<{ data: ClubSettingsRecord | null; error: string | null }> => {
  const { data, error } = await supabase.from("club_settings").select("*").eq("id", 1).single();

  if (error || !data) return { data: null, error: "Couldn't load settings. Please try again." };

  return {
    data: {
      open_time: toHm(data.open_time),
      close_time: toHm(data.close_time),
      weekly_off_days: data.weekly_off_days ?? [],
      cleanup_buffer_minutes: data.cleanup_buffer_minutes,
      default_duration_minutes: data.default_duration_minutes,
      updated_at: data.updated_at,
    },
    error: null,
  };
};

export type ClubSettingsInput = {
  open_time: string; // "HH:MM"
  close_time: string;
  weekly_off_days: number[];
  cleanup_buffer_minutes: number;
  default_duration_minutes: number;
};

export const updateClubSettings = async (input: ClubSettingsInput): Promise<{ error: string | null }> => {
  if (input.open_time >= input.close_time) {
    return { error: "Opening time must be before closing time." };
  }

  const { data: auth } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("club_settings")
    .update({
      open_time: input.open_time,
      close_time: input.close_time,
      weekly_off_days: input.weekly_off_days,
      cleanup_buffer_minutes: input.cleanup_buffer_minutes,
      default_duration_minutes: input.default_duration_minutes,
      updated_by: auth.user?.id ?? null,
    })
    .eq("id", 1);

  return { error: error ? toMessage(error.message) : null };
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