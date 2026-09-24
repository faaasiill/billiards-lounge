import { supabase } from "../../../lib/supabase";
import {
  BOOKING_SELECT,
  customerKeyOf,
  listBookings,
  toBooking,
  type AdminBooking,
  type BookingRow,
} from "./bookingsService";

export type AdminCustomer = {
  /** Normalised phone key (last 10 digits). Used as the URL id. */
  id: string;
  name: string;
  phone: string;
  total_bookings: number;
  active_bookings: number;
  cancelled_bookings: number;
  total_spent: number;
  total_minutes: number;
  first_booking_at: string;
  last_booking_at: string;
  favourite_activity: string | null;
};

export type CustomerDetails = AdminCustomer & {
  bookings: AdminBooking[];
  notes: string[];
  average_players: number;
};

const isCounted = (b: AdminBooking) => b.status !== "cancelled";

const mostCommon = (values: string[]): string | null => {
  if (values.length === 0) return null;
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
};

/** `bookings` must be sorted newest first. */
const buildCustomer = (key: string, bookings: AdminBooking[]): AdminCustomer => {
  const latest = bookings[0];
  const counted = bookings.filter(isCounted);
  const oldest = bookings[bookings.length - 1];

  return {
    id: key,
    name: latest.customer_name,
    phone: latest.customer_phone,
    total_bookings: bookings.length,
    active_bookings: counted.length,
    cancelled_bookings: bookings.length - counted.length,
    total_spent: counted.reduce((sum, b) => sum + b.total, 0),
    total_minutes: counted.reduce((sum, b) => sum + b.duration_minutes, 0),
    first_booking_at: oldest.start_at,
    last_booking_at: latest.start_at,
    favourite_activity: mostCommon(counted.map((b) => b.activity_name)),
  };
};

const byNewestFirst = (a: AdminBooking, b: AdminBooking) =>
  new Date(b.start_at).getTime() - new Date(a.start_at).getTime();

export const listCustomers = async (): Promise<{ data: AdminCustomer[]; error: string | null }> => {
  const { data: bookings, error } = await listBookings();
  if (error) return { data: [], error: "Couldn't load customers. Please try again." };

  const groups = new Map<string, AdminBooking[]>();

  for (const booking of bookings) {
    const key = customerKeyOf(booking.customer_phone);
    if (!key) continue;

    const existing = groups.get(key);
    if (existing) existing.push(booking);
    else groups.set(key, [booking]);
  }

  const customers = [...groups.entries()]
    .map(([key, list]) => buildCustomer(key, list.sort(byNewestFirst)))
    .sort((a, b) => new Date(b.last_booking_at).getTime() - new Date(a.last_booking_at).getTime());

  return { data: customers, error: null };
};

export const getCustomerDetails = async (
  customerKey: string,
): Promise<{ data: CustomerDetails | null; error: string | null }> => {
  // Coarse database filter on the trailing digits; the exact key is re-checked below.
  const { data, error } = await supabase
    .from("bookings")
    .select(BOOKING_SELECT)
    .ilike("customer_phone", `%${customerKey.slice(-6)}%`)
    .order("start_at", { ascending: false });

  if (error) return { data: null, error: "Couldn't load this customer. Please try again." };

  const matching = ((data ?? []) as unknown as BookingRow[])
    .map(toBooking)
    .filter((b) => customerKeyOf(b.customer_phone) === customerKey)
    .sort(byNewestFirst);

  if (matching.length === 0) return { data: null, error: null };

  const summary = buildCustomer(customerKey, matching);
  const counted = matching.filter(isCounted);

  const notes = matching
    .map((b) => b.customer_notes?.trim() ?? "")
    .filter((note, i, all) => note.length > 0 && all.indexOf(note) === i)
    .slice(0, 5);

  const averagePlayers =
    counted.length > 0 ? counted.reduce((sum, b) => sum + b.players, 0) / counted.length : 0;

  return {
    data: { ...summary, bookings: matching, notes, average_players: averagePlayers },
    error: null,
  };
};