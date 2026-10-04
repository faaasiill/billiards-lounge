import { supabase } from "../../../lib/supabase";

/* ------------------------------------------------------------------ */
/*  Types & labels                                                     */
/* ------------------------------------------------------------------ */

export type ChannelId = "telegram" | "ntfy";
export type BookingEventType = "new_booking" | "arrival_reminder" | "booking_start";

export const CHANNELS: { id: ChannelId; label: string }[] = [
  { id: "telegram", label: "Telegram" },
  { id: "ntfy", label: "ntfy" },
];

export const EVENTS: { id: BookingEventType; label: string; description: string }[] = [
  { id: "new_booking", label: "New booking", description: "Right after a customer books." },
  { id: "arrival_reminder", label: "Arrival reminder", description: "Shortly before the booking starts." },
  { id: "booking_start", label: "Booking start", description: "When the booking time is reached." },
];

export const EVENT_LABELS: Record<string, string> = {
  new_booking: "New booking",
  arrival_reminder: "Arrival reminder",
  booking_start: "Booking start",
  test: "Test",
};

export type RoutingMatrix = Record<BookingEventType, Record<ChannelId, boolean>>;

export type NotificationSettings = {
  telegram_enabled: boolean;
  ntfy_enabled: boolean;
  arrival_lead_minutes: number;
  routing: RoutingMatrix;
};

export type SettingsPatch = Partial<NotificationSettings>;

export type TelegramDestination = {
  id: string;
  chat_id: string;
  label: string;
  is_active: boolean;
  created_at: string;
};

export type DeliveryStatus = "pending" | "sent" | "failed" | "skipped";

export type DeliveryRecord = {
  id: string;
  booking_code: string | null;
  event_type: string;
  channel: ChannelId;
  destination_label: string | null;
  status: DeliveryStatus;
  failure_reason: string | null;
  created_at: string;
  sent_at: string | null;
};

export type ServiceStatus = {
  telegram: { configured: boolean; token_valid: boolean | null; bot_username: string | null; destinations: number };
  ntfy: { configured: boolean; server: string | null };
};

export type TestResult = {
  ok: boolean;
  results: { channel: ChannelId; destination: string; status: string; reason: string | null }[];
};

export type DetectedChat = { chat_id: string; label: string; type: string };
export type NtfyInfo = { server: string; topic: string };

const REASONS: Record<string, string> = {
  lead_window_missed: "Booked too close to the start for a reminder",
  channel_disabled: "Channel is switched off",
  event_disabled_for_channel: "Switched off for this event",
  not_configured: "Not set up on the server",
  no_destinations: "No chat added yet",
  invalid_bot_token: "Telegram rejected the bot token",
  invalid_chat_id: "Telegram can't find that chat",
  bot_blocked_or_removed: "Bot was blocked or removed from the chat",
  rate_limited: "Rate limited, will retry",
  timeout: "Timed out",
  ntfy_auth_failed: "ntfy rejected the credentials",
  delivery_in_progress: "Another worker is sending this",
  stale_reminder: "Skipped, booking had already started",
  stale_start: "Skipped, too late to be useful",
};

export const describeReason = (reason: string | null): string => {
  if (!reason) return "";
  return REASONS[reason] ?? reason.replace(/_/g, " ");
};

/* ------------------------------------------------------------------ */
/*  Settings                                                           */
/* ------------------------------------------------------------------ */

const normalizeRouting = (raw: unknown): RoutingMatrix => {
  const source = (raw ?? {}) as Partial<Record<BookingEventType, Partial<Record<ChannelId, boolean>>>>;
  const pick = (event: BookingEventType, channel: ChannelId) => source[event]?.[channel] !== false;
  return Object.fromEntries(
    EVENTS.map((e) => [e.id, { telegram: pick(e.id, "telegram"), ntfy: pick(e.id, "ntfy") }]),
  ) as RoutingMatrix;
};

export const getNotificationSettings = async (): Promise<{ data: NotificationSettings | null; error: string | null }> => {
  const { data, error } = await supabase
    .from("notification_settings")
    .select("telegram_enabled, ntfy_enabled, arrival_lead_minutes, routing")
    .eq("id", 1)
    .single();

  if (error || !data) {
    return {
      data: null,
      error:
        "Couldn't load notification settings. If you haven't yet, run supabase/008_admin_notifications.sql in the Supabase SQL Editor.",
    };
  }

  return {
    data: {
      telegram_enabled: data.telegram_enabled as boolean,
      ntfy_enabled: data.ntfy_enabled as boolean,
      arrival_lead_minutes: data.arrival_lead_minutes as number,
      routing: normalizeRouting(data.routing),
    },
    error: null,
  };
};

export const updateNotificationSettings = async (patch: SettingsPatch): Promise<{ error: string | null }> => {
  const { error } = await supabase.from("notification_settings").update(patch).eq("id", 1);
  if (error) {
    return {
      error: error.message.includes("row-level security")
        ? "You don't have permission to change notification settings."
        : "Couldn't save your changes. Please try again.",
    };
  }
  return { error: null };
};

/* ------------------------------------------------------------------ */
/*  Telegram destinations (RLS: admins only)                           */
/* ------------------------------------------------------------------ */

export const listTelegramDestinations = async (): Promise<{ data: TelegramDestination[]; error: string | null }> => {
  const { data, error } = await supabase
    .from("telegram_destinations")
    .select("id, chat_id, label, is_active, created_at")
    .order("created_at", { ascending: true });
  if (error) return { data: [], error: "Couldn't load Telegram chats." };
  return { data: (data ?? []) as TelegramDestination[], error: null };
};

export const addTelegramDestination = async (chatId: string, label: string): Promise<{ error: string | null }> => {
  const clean = chatId.trim();
  if (!/^-?\d+$/.test(clean)) return { error: "A chat ID is a number, for example 123456789 or -1001234567890." };

  const { error } = await supabase.from("telegram_destinations").insert({ chat_id: clean, label: label.trim() });
  if (error) {
    return { error: error.code === "23505" ? "That chat is already added." : "Couldn't add the chat. Please try again." };
  }
  return { error: null };
};

export const setTelegramDestinationActive = async (id: string, isActive: boolean): Promise<{ error: string | null }> => {
  const { error } = await supabase.from("telegram_destinations").update({ is_active: isActive }).eq("id", id);
  return { error: error ? "Couldn't update the chat." : null };
};

export const removeTelegramDestination = async (id: string): Promise<{ error: string | null }> => {
  const { error } = await supabase.from("telegram_destinations").delete().eq("id", id);
  return { error: error ? "Couldn't remove the chat." : null };
};

/* ------------------------------------------------------------------ */
/*  History                                                            */
/* ------------------------------------------------------------------ */

export const listDeliveries = async (limit = 60): Promise<{ data: DeliveryRecord[]; error: string | null }> => {
  const { data, error } = await supabase
    .from("notification_deliveries")
    .select("id, booking_code, event_type, channel, destination_label, status, failure_reason, created_at, sent_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return { data: [], error: "Couldn't load notification history." };
  return { data: (data ?? []) as DeliveryRecord[], error: null };
};

/* ------------------------------------------------------------------ */
/*  Edge Function calls (secrets stay on the server)                   */
/* ------------------------------------------------------------------ */

const functionError = async (error: unknown): Promise<string> => {
  const context = (error as { context?: Response } | null)?.context;
  if (context && typeof context.json === "function") {
    try {
      const body = (await context.json()) as { error?: unknown };
      if (typeof body?.error === "string") return body.error;
    } catch {
      /* fall through */
    }
  }
  return "Couldn't reach the notification service. Is the notification-admin function deployed?";
};

const callAdmin = async <T>(
  action: string,
  extra: Record<string, unknown> = {},
): Promise<{ data: T | null; error: string | null }> => {
  const { data, error } = await supabase.functions.invoke("notification-admin", { body: { action, ...extra } });
  if (error) return { data: null, error: await functionError(error) };
  return { data: data as T, error: null };
};

export const fetchServiceStatus = () => callAdmin<ServiceStatus>("status");
export const sendTestNotification = (channel: ChannelId) => callAdmin<TestResult>("test", { channel });
export const detectTelegramChats = async () => {
  const res = await callAdmin<{ chats: DetectedChat[] }>("telegram_detect_chats");
  return { data: res.data?.chats ?? null, error: res.error };
};
export const fetchNtfyInfo = () => callAdmin<NtfyInfo>("ntfy_info");