import { supabase } from "../../../lib/supabase";
import type { Activity, DurationOption } from "../types";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1642191135995-6de2cce0bbdc?auto=format&fit=crop&w=900&q=80";

export const listPublicActivities = async (): Promise<{ data: Activity[]; error: string | null }> => {
  const { data, error } = await supabase
    .from("activities")
    .select(
      `id, name, short_description, images, starting_price, min_players, max_players, sort_order,
       durations:activity_durations(id, minutes, label, price, is_active, sort_order)`,
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) return { data: [], error: "Couldn't load activities. Please try again." };

  const mapped: Activity[] = (data ?? []).map((row) => {
    const rawDurations =
      (
        row as unknown as {
          durations: { id: string; minutes: number; label: string; price: number; is_active: boolean; sort_order: number }[];
        }
      ).durations ?? [];

    const durations: DurationOption[] = rawDurations
      .filter((d) => d.is_active)
      .sort((a, b) => a.sort_order - b.sort_order || a.minutes - b.minutes)
      .map((d) => ({ id: d.id, minutes: d.minutes, label: d.label, price: Number(d.price) }));

    const prices = durations.map((d) => d.price);

    return {
      id: row.id,
      name: row.name,
      tagline: row.short_description ?? "",
      image: row.images?.[0] ?? FALLBACK_IMAGE,
      startingPrice: prices.length > 0 ? Math.min(...prices) : Number(row.starting_price),
      minPlayers: row.min_players,
      maxPlayers: row.max_players,
      players:
        row.min_players === row.max_players
          ? `${row.min_players} players`
          : `${row.min_players}-${row.max_players} players`,
      durations,
    };
  });

  // An activity with no active durations can't be booked; hide it from customers.
  return { data: mapped.filter((a) => a.durations.length > 0), error: null };
};