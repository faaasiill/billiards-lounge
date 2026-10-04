// Queue worker. Called by pg_cron every minute AND right after a booking is created
// (via pg_net). Guarded by a shared secret; never exposed to the browser.
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { serviceClient, loadSettings, loadTimeZone } from "../_shared/db.ts";
import { json } from "../_shared/http.ts";
import { timingSafeEqual } from "../_shared/security.ts";
import { channels } from "../_shared/channels/index.ts";
import { recordSkipped, sendToChannel, type DeliveryContext, type DeliveryOutcome } from "../_shared/deliver.ts";
import { renderBookingMessage } from "../_shared/messages.ts";
import type { BookingEventType, NotificationChannel, NotificationSettings } from "../_shared/types.ts";

const BATCH = 25;
const MAX_BATCHES = 4;
const MAX_ATTEMPTS = 4;
const BACKOFF_SEC = [60, 180, 600];
const START_GRACE_MS = 10 * 60_000; // an outage longer than this must not produce a "just started" alert

type EventRow = {
  id: string;
  booking_id: string | null;
  booking_code: string;
  event_type: BookingEventType;
  basis_start_at: string;
  attempts: number;
};

type BookingRow = {
  id: string;
  booking_code: string;
  customer_name: string;
  customer_phone: string;
  activity_name: string;
  start_at: string;
  end_at: string;
  duration_label: string;
  players: number;
  status: string;
  table: { label: string } | { label: string }[] | null;
};

const finalize = (db: SupabaseClient, id: string, patch: Record<string, unknown>) =>
  // Only touches rows still 'processing', so a cancel that landed mid-flight is never overwritten.
  db
    .from("notification_events")
    .update({ locked_at: null, ...patch })
    .eq("id", id)
    .eq("status", "processing");

const retryPatch = (attempts: number, retryAfterSec = 0) => {
  const delay = Math.max(BACKOFF_SEC[Math.min(attempts - 1, BACKOFF_SEC.length - 1)], retryAfterSec);
  return { status: "pending", due_at: new Date(Date.now() + delay * 1000).toISOString(), processed_at: null };
};

const skipReasonFor = (ch: NotificationChannel, type: BookingEventType, s: NotificationSettings): string | null => {
  const globallyOn = ch.id === "telegram" ? s.telegram_enabled : s.ntfy_enabled;
  if (!globallyOn) return "channel_disabled";
  if (s.routing?.[type]?.[ch.id] === false) return "event_disabled_for_channel";
  if (!ch.isConfigured()) return "not_configured";
  return null;
};

const processEvent = async (db: SupabaseClient, ev: EventRow, settings: NotificationSettings, tz: string) => {
  const now = new Date();
  const done = (status: string, reason: string | null = null) =>
    finalize(db, ev.id, { status, reason, processed_at: new Date().toISOString() });

  if (!ev.booking_id) return done("cancelled", "booking_deleted");

  const { data, error } = await db
    .from("bookings")
    .select("id, booking_code, customer_name, customer_phone, activity_name, start_at, end_at, duration_label, players, status, table:activity_tables(label)")
    .eq("id", ev.booking_id)
    .maybeSingle();

  if (error) {
    return ev.attempts < MAX_ATTEMPTS
      ? finalize(db, ev.id, retryPatch(ev.attempts))
      : done("failed", `booking_lookup_failed: ${error.message}`.slice(0, 200));
  }

  const booking = data as unknown as BookingRow | null;
  if (!booking) return done("cancelled", "booking_deleted");
  if (booking.status !== "confirmed") return done("cancelled", `booking_${booking.status}`);

  const startMs = new Date(booking.start_at).getTime();

  // The booking was moved after this event was scheduled: the new-time event owns the notification now.
  if (ev.event_type !== "new_booking" && startMs !== new Date(ev.basis_start_at).getTime()) {
    return done("cancelled", "rescheduled");
  }

  // Never send a misleading message because the worker was late / down.
  if (ev.event_type === "arrival_reminder" && now.getTime() >= startMs) return done("skipped", "stale_reminder");
  if (ev.event_type === "booking_start" && now.getTime() > startMs + START_GRACE_MS) return done("skipped", "stale_start");
  if (ev.event_type === "new_booking" && now.getTime() > new Date(booking.end_at).getTime()) return done("skipped", "booking_already_over");

  const tableRel = Array.isArray(booking.table) ? booking.table[0] : booking.table;
  const message = renderBookingMessage(ev.event_type, { ...booking, table_label: tableRel?.label ?? null }, tz, now);
  const ctx: DeliveryContext = {
    eventId: ev.id,
    bookingId: booking.id,
    bookingCode: booking.booking_code,
    eventType: ev.event_type,
  };

  const perChannel = await Promise.all(
    channels.map(async (ch): Promise<DeliveryOutcome[]> => {
      const skip = skipReasonFor(ch, ev.event_type, settings);
      if (skip) {
        await recordSkipped(db, ch.id, ctx, skip); // log it, but never attempt delivery
        return [];
      }
      return await sendToChannel(db, ch, ctx, message);
    }),
  );

  const outcomes = perChannel.flat();
  const unfinished = outcomes.filter((o) => o.status === "failed" || o.status === "pending");

  if (unfinished.length === 0) {
    return done("done", outcomes.length === 0 ? "no_channels_enabled" : null);
  }

  const retryable = unfinished.some((o) => o.retryable);
  if (retryable && ev.attempts < MAX_ATTEMPTS) {
    const wait = Math.max(0, ...unfinished.map((o) => o.retryAfterSec ?? 0));
    return finalize(db, ev.id, retryPatch(ev.attempts, wait));
  }
  return done("failed", unfinished[0].reason ?? "delivery_failed");
};

const runDispatch = async () => {
  const db = serviceClient();
  const [settings, tz] = await Promise.all([loadSettings(db), loadTimeZone(db)]);
  let processed = 0;

  for (let i = 0; i < MAX_BATCHES; i++) {
    // FOR UPDATE SKIP LOCKED inside: overlapping cron runs can never claim the same event.
    const { data, error } = await db.rpc("claim_due_notification_events", { p_limit: BATCH });
    if (error) throw new Error(`claim_failed: ${error.message}`);

    const events = (data ?? []) as EventRow[];
    for (const ev of events) {
      try {
        await processEvent(db, ev, settings, tz);
      } catch (e) {
        console.error("processEvent crashed", ev.id, (e as Error).message);
        await finalize(
          db,
          ev.id,
          ev.attempts < MAX_ATTEMPTS ? retryPatch(ev.attempts) : { status: "failed", reason: "unexpected_error", processed_at: new Date().toISOString() },
        );
      }
      processed++;
    }
    if (events.length < BATCH) break;
  }
  return { processed };
};

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const expected = Deno.env.get("DISPATCH_SECRET") ?? "";
  const provided = req.headers.get("x-dispatch-secret") ?? "";
  if (!expected || !timingSafeEqual(provided, expected)) return json({ error: "unauthorized" }, 401);

  try {
    return json(await runDispatch());
  } catch (e) {
    console.error("dispatch failed", (e as Error).message);
    return json({ error: "dispatch_failed" }, 500);
  }
});