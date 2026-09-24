import { supabase } from "../../../lib/supabase";

export type PublicClubSettings = {
  openTime: string;
  closeTime: string;
  weeklyOffDays: number[];
  cleanupBufferMinutes: number;
};

export type PublicClosure = { startDate: string; endDate: string; reason: string };

const toHm = (v: string) => v.slice(0, 5);

export const getPublicSettings = async (): Promise<{ data: PublicClubSettings | null; error: string | null }> => {
  const { data, error } = await supabase.from("club_settings").select("*").eq("id", 1).single();
  if (error || !data) return { data: null, error: "Couldn't load club hours." };

  return {
    data: {
      openTime: toHm(data.open_time),
      closeTime: toHm(data.close_time),
      weeklyOffDays: data.weekly_off_days ?? [],
      cleanupBufferMinutes: data.cleanup_buffer_minutes,
    },
    error: null,
  };
};

export const listPublicClosures = async (): Promise<{ data: PublicClosure[]; error: string | null }> => {
  const today = new Date();
  const localToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
    today.getDate(),
  ).padStart(2, "0")}`;

  const { data, error } = await supabase
    .from("club_closures")
    .select("start_date, end_date, reason")
    .gte("end_date", localToday)
    .order("start_date", { ascending: true });

  if (error) return { data: [], error: "Couldn't load closures." };

  return {
    data: (data ?? []).map((c) => ({ startDate: c.start_date, endDate: c.end_date, reason: c.reason })),
    error: null,
  };
};

/** True if the club is closed on this yyyy-mm-dd (weekly off day or a closure range). */
export const isClosedOn = (
  isoDate: string,
  settings: PublicClubSettings | null,
  closures: PublicClosure[],
): boolean => {
  if (settings) {
    const [y, m, d] = isoDate.split("-").map(Number);
    const weekday = new Date(y, m - 1, d).getDay();
    if (settings.weeklyOffDays.includes(weekday)) return true;
  }
  return closures.some((c) => isoDate >= c.startDate && isoDate <= c.endDate);
};