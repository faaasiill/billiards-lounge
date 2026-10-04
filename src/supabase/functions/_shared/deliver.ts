import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import type { ChannelId, Destination, EventType, NotificationChannel, RenderedMessage } from "./types.ts";

export type DeliveryContext = {
  eventId: string | null; // null for admin "test" sends
  bookingId: string | null;
  bookingCode: string | null;
  eventType: EventType;
};

export type DeliveryOutcome = {
  channel: ChannelId;
  destination: string;
  status: "sent" | "failed" | "skipped" | "pending";
  reason: string | null;
  retryable: boolean;
  retryAfterSec?: number;
};

const baseRow = (ctx: DeliveryContext, channel: ChannelId, key: string, label: string) => ({
  event_id: ctx.eventId,
  booking_id: ctx.bookingId,
  booking_code: ctx.bookingCode,
  event_type: ctx.eventType,
  channel,
  destination_key: key,
  destination_label: label,
});

/** Logs "we deliberately did not send" (channel off, no chat, ...). Idempotent per event+channel. */
export const recordSkipped = async (
  db: SupabaseClient,
  channel: ChannelId,
  ctx: DeliveryContext,
  reason: string,
): Promise<void> => {
  await db.from("notification_deliveries").upsert(
    { ...baseRow(ctx, channel, "n/a", "n/a"), status: "skipped", failure_reason: reason },
    { onConflict: "event_id,channel,destination_key", ignoreDuplicates: true },
  );
};

const deliverOne = async (
  db: SupabaseClient,
  channel: NotificationChannel,
  dest: Destination,
  ctx: DeliveryContext,
  msg: RenderedMessage,
): Promise<DeliveryOutcome> => {
  const outcome = (o: Partial<DeliveryOutcome> & Pick<DeliveryOutcome, "status">): DeliveryOutcome => ({
    channel: channel.id,
    destination: dest.label,
    reason: null,
    retryable: false,
    ...o,
  });

  let rowId: string | null = null;
  let previousAttempts = 0;

  // IDEMPOTENCY: if this event already reached this destination, never send again.
  if (ctx.eventId) {
    const { data: existing } = await db
      .from("notification_deliveries")
      .select("id, status, attempts")
      .eq("event_id", ctx.eventId)
      .eq("channel", channel.id)
      .eq("destination_key", dest.key)
      .maybeSingle();

    if (existing) {
      if (existing.status === "sent" || existing.status === "skipped") {
        return outcome({ status: existing.status as "sent" | "skipped" });
      }
      rowId = existing.id as string;
      previousAttempts = (existing.attempts as number) ?? 0;
    }
  }

  if (!rowId) {
    const { data, error } = await db
      .from("notification_deliveries")
      .insert({ ...baseRow(ctx, channel.id, dest.key, dest.label), status: "pending" })
      .select("id")
      .single();

    // Unique violation = another worker owns this delivery. Don't double-send; look again later.
    if (error || !data) return outcome({ status: "pending", reason: "delivery_in_progress", retryable: true });
    rowId = data.id as string;
  }

  const result = await channel.send(dest, msg);

  await db
    .from("notification_deliveries")
    .update({
      status: result.ok ? "sent" : "failed",
      attempts: previousAttempts + 1,
      sent_at: result.ok ? new Date().toISOString() : null,
      failure_reason: result.ok ? null : result.reason,
    })
    .eq("id", rowId);

  return result.ok
    ? outcome({ status: "sent" })
    : outcome({ status: "failed", reason: result.reason, retryable: result.retryable, retryAfterSec: result.retryAfterSec });
};

/** Sends one message to every destination of one channel, logging each attempt. */
export const sendToChannel = async (
  db: SupabaseClient,
  channel: NotificationChannel,
  ctx: DeliveryContext,
  msg: RenderedMessage,
): Promise<DeliveryOutcome[]> => {
  let destinations: Destination[];
  try {
    destinations = await channel.listDestinations(db);
  } catch (e) {
    const reason = `destination_lookup_failed: ${(e as Error).message}`.slice(0, 200);
    await db.from("notification_deliveries").upsert(
      { ...baseRow(ctx, channel.id, "n/a", "n/a"), status: "failed", failure_reason: reason },
      { onConflict: "event_id,channel,destination_key" },
    );
    return [{ channel: channel.id, destination: "n/a", status: "failed", reason, retryable: true }];
  }

  if (destinations.length === 0) {
    await recordSkipped(db, channel.id, ctx, "no_destinations");
    return [{ channel: channel.id, destination: "n/a", status: "skipped", reason: "no_destinations", retryable: false }];
  }

  return await Promise.all(destinations.map((d) => deliverOne(db, channel, d, ctx, msg)));
};