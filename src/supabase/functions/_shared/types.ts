import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

export type ChannelId = "telegram" | "ntfy";
export type BookingEventType = "new_booking" | "arrival_reminder" | "booking_start";
export type EventType = BookingEventType | "test";

export type NotificationSettings = {
  telegram_enabled: boolean;
  ntfy_enabled: boolean;
  arrival_lead_minutes: number;
  routing: Partial<Record<BookingEventType, Partial<Record<ChannelId, boolean>>>>;
};

/** Channel-neutral message. Each channel decides how to present it. */
export type RenderedMessage = {
  title: string;
  /** Used by Telegram (ntfy shows an emoji from `tags` instead). */
  emoji: string;
  fields: Array<[label: string, value: string]>;
  /** ntfy priority 1 (min) .. 5 (max). */
  priority: 1 | 2 | 3 | 4 | 5;
  /** ntfy emoji short-codes. */
  tags: string[];
};

export type Destination = { key: string; label: string };

export type SendResult =
  | { ok: true }
  | { ok: false; reason: string; retryable: boolean; retryAfterSec?: number };

/**
 * Add a channel (WhatsApp, SMS, email, Discord...) by implementing this and
 * adding it to the registry in channels/index.ts. Nothing else changes.
 */
export interface NotificationChannel {
  readonly id: ChannelId;
  readonly label: string;
  isConfigured(): boolean;
  listDestinations(db: SupabaseClient): Promise<Destination[]>;
  send(destination: Destination, message: RenderedMessage): Promise<SendResult>;
}