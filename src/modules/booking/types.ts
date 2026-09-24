export type ActivityId = string;

export interface DurationOption {
  id: string;
  minutes: number;
  label: string; // "60 min"
  price: number; // absolute price for this duration, before any peak surcharge
}

export interface Activity {
  id: ActivityId;
  name: string;
  tagline: string;
  image: string;
  startingPrice: number; // the cheapest duration's price, shown on the card
  players?: string; // e.g. "2-4 players" — display copy on the activity card
  minPlayers: number; // lower bound for the players stepper
  maxPlayers: number; // upper bound for the players stepper
  durations: DurationOption[];
}

export interface TimeSlot {
  id: string;
  time: string; // "18:00"
  label: string; // "6:00 PM"
  available: boolean;
  isPeak: boolean;
}

export interface DateOption {
  id: string; // ISO date, yyyy-mm-dd
  date: Date;
  dayLabel: string; // "Mon"
  dayNumber: string; // "24"
  monthLabel: string; // "Sep"
  isToday: boolean;
}

export interface CustomerDetails {
  name: string;
  phone: string;
  notes?: string;
}

export interface BookingDraft {
  activity: Activity | null;
  date: DateOption | null;
  slot: TimeSlot | null;
  duration: DurationOption | null;
  players: number | null;
  customer: CustomerDetails | null;
}

/**
 * A finalized, confirmed booking — what gets stored in history once
 * ConfirmationScreen shows a booking ID. Distinct from BookingDraft
 * (which holds nullable in-progress selections): every field here is
 * required because a booking can't be confirmed until all of them exist.
 */
export interface Booking {
  id: string; // the short booking ID shown on ConfirmationScreen (e.g. "A3F9K2")
  activity: Activity;
  date: DateOption;
  slot: TimeSlot;
  duration: DurationOption;
  players: number;
  customer: CustomerDetails;
  total: number;
  createdAt: string; // ISO timestamp, for ordering history newest-first
}