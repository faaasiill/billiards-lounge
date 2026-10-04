import { supabase } from "../../../lib/supabase";
import { dateToOption } from "../mockData";
import type { Booking } from "../types";

type Row = {
  booking_code: string;
  activity_id: string;
  activity_name: string;
  duration_minutes: number;
  duration_label: string;
  price: number;
  peak_surcharge: number;
  total: number;
  start_at: string;
  players: number;
  customer_name: string;
  customer_notes: string | null;
  created_at: string;
  image: string | null;
};

type TableRow = { booking_code: string; table_label: string };

const CLUB_TIME_ZONE = "Asia/Kolkata";

const timeFormatter = new Intl.DateTimeFormat("en-IN", {
  timeZone: CLUB_TIME_ZONE,
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const hmFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: CLUB_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export const listBookingsByPhone = async (
  phone: string,
): Promise<{ data: Booking[]; error: string | null }> => {
  // Table names come from a separate RPC (supabase/007_booking_table_labels.sql).
  // If it isn't installed yet or fails, bookings still load, just without a table line.
  const [bookingsRes, tablesRes] = await Promise.all([
    supabase.rpc("get_bookings_by_phone", { p_phone: phone }),
    supabase.rpc("get_booking_tables_by_phone", { p_phone: phone }),
  ]);

  if (bookingsRes.error) return { data: [], error: "Couldn't load your bookings. Please try again." };

  const tableByCode = new Map<string, string>(
    ((tablesRes.error ? [] : tablesRes.data ?? []) as TableRow[]).map((t) => [t.booking_code, t.table_label]),
  );

  const mapped: Booking[] = ((bookingsRes.data ?? []) as Row[]).map((r) => {
    const start = new Date(r.start_at);

    return {
      id: r.booking_code,
      activity: {
        id: r.activity_id,
        name: r.activity_name,
        tagline: "",
        image: r.image ?? "",
        startingPrice: Number(r.price),
        minPlayers: r.players,
        maxPlayers: r.players,
        durations: [],
      },
      date: dateToOption(start),
      slot: {
        id: r.start_at,
        time: hmFormatter.format(start),
        label: timeFormatter.format(start).toUpperCase(),
        available: true,
        isPeak: Number(r.peak_surcharge) > 0,
      },
      duration: { id: "", minutes: r.duration_minutes, label: r.duration_label, price: Number(r.price) },
      players: r.players,
      customer: { name: r.customer_name, phone, notes: r.customer_notes ?? undefined },
      total: Number(r.total),
      createdAt: r.created_at,
      tableLabel: tableByCode.get(r.booking_code) ?? null,
    };
  });

  return { data: mapped, error: null };
};