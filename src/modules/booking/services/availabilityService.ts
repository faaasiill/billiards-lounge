import { supabase } from "../../../lib/supabase";

export type AvailabilitySlot = {
  /** "HH:MM" in club-local wall-clock time. */
  startTime: string;
  /** Absolute instant for this start time. */
  startAt: string;
  /** How many of the activity's active tables are free for this start time. */
  tablesAvailable: number;
};

export type TableStatus = {
  id: string;
  label: string;
  position: number;
  /** True when the table is already booked (or in its cleanup buffer) for the window. */
  booked: boolean;
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
 * Per-table status (free / booked) for one specific start time and duration.
 * Used to render the table picker. See supabase/006_table_selection.sql.
 */
export const getTableAvailability = async (
  activityId: string,
  startAt: string, // ISO instant
  durationMinutes: number,
): Promise<{ data: TableStatus[]; error: string | null }> => {
  const start = new Date(startAt);
  const end = new Date(start.getTime() + durationMinutes * 60_000);

  const { data, error } = await supabase.rpc("get_table_availability", {
    p_activity_id: activityId,
    p_start_at: start.toISOString(),
    p_end_at: end.toISOString(),
  });

  if (error) return { data: [], error: "Couldn't load tables. Please try again." };

  return {
    data: (data ?? []).map(
      (r: { table_id: string; label: string; position: number; is_booked: boolean }) => ({
        id: r.table_id,
        label: r.label,
        position: r.position,
        booked: r.is_booked,
      }),
    ),
    error: null,
  };
};

/**
 * Books a table for the given activity/window and inserts the booking row.
 * If `tableId` is given, that exact table is validated and used; otherwise
 * the first available table is auto-assigned via `find_available_table`
 * (SKIP LOCKED, race-safe). Snapshots activity/duration details onto the
 * booking so it stays historically accurate if the activity is edited later.
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
  /** Specific table chosen by the customer. Omit/null to auto-assign. */
  tableId?: string | null;
};

const randomBookingCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

export const createBooking = async (
  input: CreateBookingInput,
): Promise<{ bookingCode: string | null; tableLabel?: string | null; error: string | null }> => {
  const startAt = new Date(input.startAt);
  const endAt = new Date(startAt.getTime() + input.durationMinutes * 60_000);

  const { data: tableId, error: tableError } = input.tableId
    ? await supabase.rpc("claim_table", {
        p_activity_id: input.activityId,
        p_table_id: input.tableId,
        p_start_at: startAt.toISOString(),
        p_end_at: endAt.toISOString(),
      })
    : await supabase.rpc("find_available_table", {
        p_activity_id: input.activityId,
        p_start_at: startAt.toISOString(),
        p_end_at: endAt.toISOString(),
      });

  if (tableError) return { bookingCode: null, error: "Couldn't check availability. Please try again." };

  if (!tableId) {
    return {
      bookingCode: null,
      error: input.tableId
        ? "That table was just taken. Please pick another."
        : "That time was just taken. Please pick another slot.",
    };
  }

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

  // Look up the table's name so the confirmation screen can show which table
  // was assigned (important when the customer chose "Any").
  const { data: tableRow } = await supabase
    .from("activity_tables")
    .select("label")
    .eq("id", tableId)
    .maybeSingle();

  return { bookingCode, tableLabel: (tableRow?.label as string | undefined) ?? null, error: null };
};