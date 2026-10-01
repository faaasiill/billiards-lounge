import { supabase } from "../../../lib/supabase";

export type ClearScope = "bookings" | "activities" | "closures" | "settings" | "all";

export type ClearResult = {
  scope: ClearScope;
  bookings: number;
  activities: number;
  closures: number;
};

const toMessage = (raw: string | undefined): string => {
  if (!raw) return "Something went wrong. Please try again.";
  if (raw.includes("not_authorized")) return "You don't have permission to do that.";
  if (raw.includes("invalid_scope")) return "Unknown data type.";
  if (raw.includes("admin_clear_data")) {
    return "The reset function is missing. Run supabase/005_data_reset.sql in the Supabase SQL Editor first.";
  }
  return "Something went wrong. Please try again.";
};

export const clearData = async (
  scope: ClearScope,
): Promise<{ data: ClearResult | null; error: string | null }> => {
  const { data, error } = await supabase.rpc("admin_clear_data", { p_scope: scope });

  if (error) return { data: null, error: toMessage(error.message) };

  return { data: data as ClearResult, error: null };
};