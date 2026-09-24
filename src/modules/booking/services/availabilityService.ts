import { supabase } from "../../../lib/supabase";

export type AvailabilitySlot = {
  /** "HH:MM" in club-local wall-clock time. */
  startTime: string;
  /** Absolute instant for this start time. */
  startAt: string;
  /** How many of the activity's active tables are free for this start time. */
  tablesAvailable: number;
};

/**
 * Calls the `get_activity_availability` Postgres function, which computes
 * start times dynamically from working hours, the requested duration,
 * existing bookings, active table count, and the club cleanup buffer — see
 * sql/002_availability.sql for the full algorithm. Nothing here hardcodes a
 * fixed slot grid; the shape of the returned ladder changes with the
 * duration the caller passes in.
 */
export const getActivityAvailability = async (
  activityId: string,
  date: string, // yyyy-mm-dd
  durationMinutes: number,
): Promise<{ data: AvailabilitySlot[]; error: string | null }> => {
  const { data, error } = await supabase.rpc("get_activity_availability", {
    p_activity_id: activityId,
    p_date: date,
    p_duration_minutes: durationMinutes,
  });

  if (error) {
    return { data: [], error: "Couldn't load availability. Please try again." };
  }

  const mapped: AvailabilitySlot[] = (data ?? []).map(
    (row: { start_time: string; start_at: string; tables_available: number }) => ({
      startTime: row.start_time,
      startAt: row.start_at,
      tablesAvailable: row.tables_available,
    }),
  );

  return { data: mapped, error: null };
};

/**
 * Books the first available table for the given activity/window via the
 * `find_available_table` RPC (SKIP LOCKED, race-safe) and inserts the
 * booking row. Snapshots activity/duration details onto the booking so it
 * stays historically accurate if the activity is edited later.
 */
export type CreateBookingInput = {
  activityId: string;
  activityName: string;
  durationId: string | null;
  durationMinutes: number;
  durationLabel: string;
  price: number;
  peakSurcharge: number;
  startAt: string; // ISO instant
  players: number;
  customerName: string;
  customerPhone: string;
  customerNotes?: string;
};

const randomBookingCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

export const createBooking = async (
  input: CreateBookingInput,
): Promise<{ bookingCode: string | null; error: string | null }> => {
  const startAt = new Date(input.startAt);
  const endAt = new Date(startAt.getTime() + input.durationMinutes * 60_000);

  const { data: tableId, error: tableError } = await supabase.rpc("find_available_table", {
    p_activity_id: input.activityId,
    p_start_at: startAt.toISOString(),
    p_end_at: endAt.toISOString(),
  });

  if (tableError) return { bookingCode: null, error: "Couldn't check availability. Please try again." };
  if (!tableId) return { bookingCode: null, error: "That time was just taken. Please pick another slot." };

  const bookingCode = randomBookingCode();
  const total = input.price + input.peakSurcharge;

  const { error: insertError } = await supabase.from("bookings").insert({
    booking_code: bookingCode,
    activity_id: input.activityId,
    activity_table_id: tableId,
    duration_id: input.durationId,
    activity_name: input.activityName,
    duration_minutes: input.durationMinutes,
    duration_label: input.durationLabel,
    price: input.price,
    peak_surcharge: input.peakSurcharge,
    total,
    start_at: startAt.toISOString(),
    end_at: endAt.toISOString(),
    players: input.players,
    customer_name: input.customerName,
    customer_phone: input.customerPhone,
    customer_notes: input.customerNotes || null,
  });

  if (insertError) return { bookingCode: null, error: "Couldn't confirm the booking. Please try again." };

  return { bookingCode, error: null };
};