import type { BookingEventType, RenderedMessage } from "./types.ts";
import { formatDate, formatPhone, formatTime, humanizeMinutes } from "./time.ts";

export type BookingForMessage = {
  booking_code: string;
  customer_name: string;
  customer_phone: string;
  activity_name: string;
  start_at: string;
  duration_label: string;
  players: number;
  table_label: string | null;
};

export const renderBookingMessage = (
  type: BookingEventType,
  b: BookingForMessage,
  timeZone: string,
  now: Date = new Date(),
): RenderedMessage => {
  const table: Array<[string, string]> = b.table_label ? [["Table", b.table_label]] : [];
  const time = formatTime(b.start_at, timeZone);

  switch (type) {
    case "new_booking":
      return {
        emoji: "🔔",
        title: "New Booking",
        priority: 3,
        tags: ["bell"],
        fields: [
          ["Customer", b.customer_name],
          ["Phone", formatPhone(b.customer_phone)],
          ["Activity", b.activity_name],
          ["Date", formatDate(b.start_at, timeZone)],
          ["Time", time],
          ["Duration", b.duration_label],
          ...table,
          ["Players", String(b.players)],
          ["Booking ID", `#${b.booking_code}`],
        ],
      };

    case "arrival_reminder": {
      // Computed at SEND time, so the text is always true even if the cron ran late.
      const minutes = Math.max(1, Math.ceil((new Date(b.start_at).getTime() - now.getTime()) / 60_000));
      return {
        emoji: "⏰",
        title: "Upcoming Booking",
        priority: 4,
        tags: ["alarm_clock"],
        fields: [
          ["Customer", b.customer_name],
          ["Activity", b.activity_name],
          ...table,
          ["Arrival", time],
          ["Starts in", humanizeMinutes(minutes)],
        ],
      };
    }

    case "booking_start":
      return {
        emoji: "🎱",
        title: "Booking Started",
        priority: 4,
        tags: ["8ball"],
        fields: [
          ["Customer", b.customer_name],
          ["Activity", b.activity_name],
          ...table,
          ["Time", time],
          ["Duration", b.duration_label],
        ],
      };
  }
};

export const renderTestMessage = (timeZone: string, now: Date = new Date()): RenderedMessage => ({
  emoji: "✅",
  title: "Test notification",
  priority: 3,
  tags: ["white_check_mark"],
  fields: [
    ["Status", "Admin notifications are working"],
    ["Sent at", `${formatDate(now.toISOString(), timeZone)}, ${formatTime(now.toISOString(), timeZone)}`],
  ],
});