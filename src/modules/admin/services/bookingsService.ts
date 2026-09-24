import { supabase } from "../../../lib/supabase";

export type BookingStatus = "confirmed" | "cancelled" | string;

export type AdminBooking = {
  id: string;
  booking_code: string;
  activity_id: string;
  activity_table_id: string;
  activity_name: string;
  table_label: string | null;
  duration_minutes: number;
  duration_label: string;
  price: number;
  peak_surcharge: number;
  total: number;
  start_at: string;
  end_at: string;
  players: number;
  customer_name: string;
  customer_phone: string;
  customer_notes: string | null;
  status: BookingStatus;
  created_at: string;
};

export type BookingRow = {
  id: string;
  booking_code: string;
  activity_id: string;
  activity_table_id: string;
  activity_name: string;
  duration_minutes: number;
  duration_label: string;
  price: number | string;
  peak_surcharge: number | string;
  total: number | string;
  start_at: string;
  end_at: string;
  players: number;
  customer_name: string;
  customer_phone: string;
  customer_notes: string | null;
  status: string;
  created_at: string;
  table: { label: string } | { label: string }[] | null;
};

export const BOOKING_SELECT = `
  id, booking_code, activity_id, activity_table_id, activity_name,
  duration_minutes, duration_label, price, peak_surcharge, total,
  start_at, end_at, players, customer_name, customer_phone, customer_notes,
  status, created_at,
  table:activity_tables(label)
`;

export const toBooking = (row: BookingRow): AdminBooking => {
  const tableRel = Array.isArray(row.table) ? row.table[0] : row.table;

  return {
    id: row.id,
    booking_code: row.booking_code,
    activity_id: row.activity_id,
    activity_table_id: row.activity_table_id,
    activity_name: row.activity_name,
    table_label: tableRel?.label ?? null,
    duration_minutes: row.duration_minutes,
    duration_label: row.duration_label,
    price: Number(row.price),
    peak_surcharge: Number(row.peak_surcharge),
    total: Number(row.total),
    start_at: row.start_at,
    end_at: row.end_at,
    players: row.players,
    customer_name: row.customer_name,
    customer_phone: row.customer_phone,
    customer_notes: row.customer_notes,
    status: row.status,
    created_at: row.created_at,
  };
};

/** Digits only, so "+91 98765-43210" and "9876543210" can be matched together. */
export const normalizePhone = (phone: string): string => phone.replace(/\D+/g, "");

/**
 * Uses the last 10 digits as the customer key when available, so a number saved
 * with or without a country code still maps to the same customer.
 */
export const customerKeyOf = (phone: string): string => {
  const digits = normalizePhone(phone);
  return digits.length > 10 ? digits.slice(-10) : digits;
};

export const listBookings = async (): Promise<{ data: AdminBooking[]; error: string | null }> => {
  const { data, error } = await supabase
    .from("bookings")
    .select(BOOKING_SELECT)
    .order("start_at", { ascending: false })
    .limit(500);

  if (error) return { data: [], error: "Couldn't load bookings. Please try again." };

  return { data: ((data ?? []) as unknown as BookingRow[]).map(toBooking), error: null };
};

export const cancelBooking = async (bookingId: string): Promise<{ error: string | null }> => {
  const { error } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId);

  if (error) {
    if (error.message.includes("row-level security")) {
      return { error: "You don't have permission to cancel bookings." };
    }
    return { error: "Couldn't cancel this booking. Please try again." };
  }

  return { error: null };
};