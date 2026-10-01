import { supabase } from "../../../lib/supabase";
import type { Activity, DurationOption } from "../types";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1642191135995-6de2cce0bbdc?auto=format&fit=crop&w=900&q=80";

type RawDuration = {
  id: string;
  minutes: number;
  label: string;
  price: number;
  is_active: boolean;
  sort_order: number;
};

type Row = {
  id: string;
  name: string;
  short_description: string | null;
  images: string[] | null;
  starting_price: number | string;
  min_players: number;
  max_players: number;
  sort_order: number;
  is_group: boolean | null;
  parent_id: string | null;
  durations: RawDuration[] | null;
};

const toDurations = (row: Row): DurationOption[] =>
  (row.durations ?? [])
    .filter((d) => d.is_active)
    .sort((a, b) => a.sort_order - b.sort_order || a.minutes - b.minutes)
    .map((d) => ({ id: d.id, minutes: d.minutes, label: d.label, price: Number(d.price) }));

const toActivity = (row: Row, fallbackImage?: string): Activity => {
  const durations = toDurations(row);
  const prices = durations.map((d) => d.price);

  return {
    id: row.id,
    name: row.name,
    tagline: row.short_description ?? "",
    image: row.images?.[0] ?? fallbackImage ?? FALLBACK_IMAGE,
    startingPrice: prices.length > 0 ? Math.min(...prices) : Number(row.starting_price),
    minPlayers: row.min_players,
    maxPlayers: row.max_players,
    players:
      row.min_players === row.max_players
        ? `${row.min_players} players`
        : `${row.min_players}-${row.max_players} players`,
    durations,
  };
};

/**
 * Top-level list shown on the first screen.
 *  - Normal activities (Chess, PS5, ...) come through exactly as before.
 *  - A group (Billiards) comes through as one card with `subcategories`
 *    (Snooker, 8-Ball), each a fully bookable activity with its own
 *    tables, durations and pricing.
 */
export const listPublicActivities = async (): Promise<{ data: Activity[]; error: string | null }> => {
  const { data, error } = await supabase
    .from("activities")
    .select(
      `id, name, short_description, images, starting_price, min_players, max_players, sort_order,
       is_group, parent_id,
       durations:activity_durations(id, minutes, label, price, is_active, sort_order)`,
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) return { data: [], error: "Couldn't load activities. Please try again." };

  const rows = (data ?? []) as unknown as Row[];

  const childrenByParent = new Map<string, Row[]>();
  for (const row of rows) {
    if (!row.parent_id) continue;
    const list = childrenByParent.get(row.parent_id) ?? [];
    list.push(row);
    childrenByParent.set(row.parent_id, list);
  }

  const result: Activity[] = [];

  for (const row of rows) {
    if (row.parent_id) continue; // game types are reached through their group

    if (!row.is_group) {
      const activity = toActivity(row);
      // An activity with no active durations can't be booked; hide it from customers.
      if (activity.durations.length > 0) result.push(activity);
      continue;
    }

    const groupImage = row.images?.[0] ?? undefined;
    const kids = (childrenByParent.get(row.id) ?? [])
      .map((child) => ({ ...toActivity(child, groupImage), groupName: row.name }))
      .filter((child) => child.durations.length > 0);

    if (kids.length === 0) continue; // nothing bookable inside this group

    result.push({
      id: row.id,
      name: row.name,
      tagline: row.short_description ?? "",
      image: groupImage ?? kids[0].image,
      startingPrice: Math.min(...kids.map((k) => k.startingPrice)),
      minPlayers: Math.min(...kids.map((k) => k.minPlayers)),
      maxPlayers: Math.max(...kids.map((k) => k.maxPlayers)),
      durations: [],
      subcategories: kids,
    });
  }

  return { data: result, error: null };
};