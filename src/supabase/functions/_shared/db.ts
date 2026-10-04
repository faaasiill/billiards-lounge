import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import type { NotificationSettings } from "./types.ts";
import { DEFAULT_TZ } from "./time.ts";

/** Service-role client. Server-side only; bypasses RLS. */
export const serviceClient = (): SupabaseClient =>
  createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

export const loadSettings = async (db: SupabaseClient): Promise<NotificationSettings> => {
  const { data, error } = await db
    .from("notification_settings")
    .select("telegram_enabled, ntfy_enabled, arrival_lead_minutes, routing")
    .eq("id", 1)
    .single();
  if (error || !data) throw new Error(`settings_unavailable: ${error?.message ?? "no row"}`);
  return data as NotificationSettings;
};

/** The club's business timezone. Falls back to Asia/Kolkata. Never the browser's. */
export const loadTimeZone = async (db: SupabaseClient): Promise<string> => {
  const { data } = await db.from("club_settings").select("timezone").eq("id", 1).maybeSingle();
  return (data?.timezone as string | undefined) || DEFAULT_TZ;
};