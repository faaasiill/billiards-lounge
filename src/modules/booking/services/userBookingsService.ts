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
  const { data, error } = await supabase.rpc("get_bookings_by_phone", { p_phone: phone });

  if (error) return { data: [], error: "Couldn't load your bookings. Please try again." };

  const mapped: Booking[] = ((data ?? []) as Row[]).map((r) => {
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
    };
  });

  return { data: mapped, error: null };
};