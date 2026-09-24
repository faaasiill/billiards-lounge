import { supabase } from "../../../lib/supabase";

export type AdminActivityDuration = {
  id: string;
  activity_id: string;
  minutes: number;
  label: string;
  price: number;
  is_active: boolean;
  sort_order: number;
};

export type AdminActivity = {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  images: string[];
  starting_price: number;
  min_players: number;
  max_players: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  durations: AdminActivityDuration[];
  /** Count of active tables — fetched alongside for the list view. */
  table_count: number;
};

export type ActivityDurationInput = {
  id?: string; // present = update existing, absent = create new
  minutes: number;
  label: string;
  price: number;
};

export type ActivityInput = {
  name: string;
  short_description: string;
  images: string[];
  min_players: number;
  max_players: number;
  is_active: boolean;
  /** Desired total active table count — reconciled against existing rows. */
  table_count: number;
  durations: ActivityDurationInput[];
};

const ERROR_MESSAGES: Record<string, string> = {
  duplicate_slug: "An activity with a similar name already exists.",
};

const toMessage = (raw: string | undefined): string => {
  if (!raw) return "Something went wrong. Please try again.";
  const key = Object.keys(ERROR_MESSAGES).find((k) => raw.includes(k));
  if (key) return ERROR_MESSAGES[key];
  if (raw.includes("duplicate key") && raw.includes("slug")) {
    return "An activity with a similar name already exists.";
  }
  return "Something went wrong. Please try again.";
};

const slugify = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/** Cheapest active duration's price, used as the display "starting price". */
const computeStartingPrice = (durations: ActivityDurationInput[]): number => {
  const prices = durations.map((d) => d.price);
  return prices.length > 0 ? Math.min(...prices) : 0;
};

export const listActivities = async (): Promise<{ data: AdminActivity[]; error: string | null }> => {
  const { data, error } = await supabase
    .from("activities")
    .select(
      `id, name, slug, short_description, images, starting_price, min_players, max_players,
       is_active, sort_order, created_at, updated_at,
       durations:activity_durations(id, activity_id, minutes, label, price, is_active, sort_order),
       tables:activity_tables(id, is_active)`,
    )
    .order("sort_order", { ascending: true });

  if (error) return { data: [], error: "Couldn't load activities. Please try again." };

  const mapped: AdminActivity[] = (data ?? []).map((row) => {
    const tables = (row as unknown as { tables: { id: string; is_active: boolean }[] }).tables ?? [];
    const durations = ((row as unknown as { durations: AdminActivityDuration[] }).durations ?? [])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order || a.minutes - b.minutes);

    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      short_description: row.short_description,
      images: row.images ?? [],
      starting_price: Number(row.starting_price),
      min_players: row.min_players,
      max_players: row.max_players,
      is_active: row.is_active,
      sort_order: row.sort_order,
      created_at: row.created_at,
      updated_at: row.updated_at,
      durations: durations.map((d) => ({ ...d, price: Number(d.price) })),
      table_count: tables.filter((t) => t.is_active).length,
    };
  });

  return { data: mapped, error: null };
};

/**
 * Creates a new activity, its duration rows, and its table pool in one
 * transaction-like sequence (Supabase JS has no client-side multi-table
 * transaction, so we do best-effort sequential inserts and surface the
 * first error; partial creation is acceptable here since an admin can
 * retry/edit — nothing customer-facing is exposed until is_active is set,
 * which only happens if every step below succeeds).
 */
export const createActivity = async (
  input: ActivityInput,
): Promise<{ id: string | null; error: string | null }> => {
  const slug = slugify(input.name);
  const startingPrice = computeStartingPrice(input.durations);

  const { data: activity, error: activityError } = await supabase
    .from("activities")
    .insert({
      name: input.name.trim(),
      slug,
      short_description: input.short_description.trim(),
      images: input.images,
      starting_price: startingPrice,
      min_players: input.min_players,
      max_players: input.max_players,
      is_active: false, // flip on only after durations + tables succeed
    })
    .select("id")
    .single();

  if (activityError || !activity) return { id: null, error: toMessage(activityError?.message) };

  const activityId = activity.id as string;

  if (input.durations.length > 0) {
    const { error: durationsError } = await supabase.from("activity_durations").insert(
      input.durations.map((d, i) => ({
        activity_id: activityId,
        minutes: d.minutes,
        label: d.label,
        price: d.price,
        sort_order: i,
      })),
    );
    if (durationsError) return { id: activityId, error: toMessage(durationsError.message) };
  }

  if (input.table_count > 0) {
    const { error: tablesError } = await supabase.from("activity_tables").insert(
      Array.from({ length: input.table_count }, (_, i) => ({
        activity_id: activityId,
        label: `Table ${i + 1}`,
        position: i + 1,
      })),
    );
    if (tablesError) return { id: activityId, error: toMessage(tablesError.message) };
  }

  const { error: activateError } = await supabase
    .from("activities")
    .update({ is_active: input.is_active })
    .eq("id", activityId);

  if (activateError) return { id: activityId, error: toMessage(activateError.message) };

  return { id: activityId, error: null };
};

/**
 * Updates an activity's core fields, reconciles its duration set (update
 * existing rows in place, insert new ones, retire ones the admin removed —
 * never hard-delete, since a duration may already be referenced by a
 * booking), and reconciles its table pool by count (add tables to reach a
 * higher count, retire the highest-position active tables to reach a lower
 * count — again never deleting).
 */
export const updateActivity = async (
  activityId: string,
  input: ActivityInput,
): Promise<{ error: string | null }> => {
  const startingPrice = computeStartingPrice(input.durations);

  const { error: activityError } = await supabase
    .from("activities")
    .update({
      name: input.name.trim(),
      short_description: input.short_description.trim(),
      images: input.images,
      starting_price: startingPrice,
      min_players: input.min_players,
      max_players: input.max_players,
      is_active: input.is_active,
    })
    .eq("id", activityId);

  if (activityError) return { error: toMessage(activityError.message) };

  // --- Reconcile durations ---
  const { data: existingDurations, error: fetchDurationsError } = await supabase
    .from("activity_durations")
    .select("id, minutes")
    .eq("activity_id", activityId)
    .eq("is_active", true);

  if (fetchDurationsError) return { error: toMessage(fetchDurationsError.message) };

  const keptIds = new Set(input.durations.filter((d) => d.id).map((d) => d.id));
  const toRetire = (existingDurations ?? []).filter((d) => !keptIds.has(d.id));
  const toUpdate = input.durations.filter((d) => d.id);
  const toInsert = input.durations.filter((d) => !d.id);

  if (toRetire.length > 0) {
    const { error } = await supabase
      .from("activity_durations")
      .update({ is_active: false })
      .in(
        "id",
        toRetire.map((d) => d.id),
      );
    if (error) return { error: toMessage(error.message) };
  }

  for (const [i, d] of toUpdate.entries()) {
    const { error } = await supabase
      .from("activity_durations")
      .update({ minutes: d.minutes, label: d.label, price: d.price, sort_order: i })
      .eq("id", d.id as string);
    if (error) return { error: toMessage(error.message) };
  }

  if (toInsert.length > 0) {
    const { error } = await supabase.from("activity_durations").insert(
      toInsert.map((d, i) => ({
        activity_id: activityId,
        minutes: d.minutes,
        label: d.label,
        price: d.price,
        sort_order: toUpdate.length + i,
      })),
    );
    if (error) return { error: toMessage(error.message) };
  }

  // --- Reconcile table count ---
  const { data: existingTables, error: fetchTablesError } = await supabase
    .from("activity_tables")
    .select("id, position")
    .eq("activity_id", activityId)
    .eq("is_active", true)
    .order("position", { ascending: true });

  if (fetchTablesError) return { error: toMessage(fetchTablesError.message) };

  const currentCount = existingTables?.length ?? 0;
  const desiredCount = input.table_count;

  if (desiredCount > currentCount) {
    const highestPosition = existingTables?.reduce((max, t) => Math.max(max, t.position), 0) ?? 0;
    const toAdd = desiredCount - currentCount;
    const { error } = await supabase.from("activity_tables").insert(
      Array.from({ length: toAdd }, (_, i) => ({
        activity_id: activityId,
        label: `Table ${highestPosition + i + 1}`,
        position: highestPosition + i + 1,
      })),
    );
    if (error) return { error: toMessage(error.message) };
  } else if (desiredCount < currentCount) {
    const toRemoveCount = currentCount - desiredCount;
    const idsToRetire = (existingTables ?? []).slice(-toRemoveCount).map((t) => t.id);
    const { error } = await supabase
      .from("activity_tables")
      .update({ is_active: false })
      .in("id", idsToRetire);
    if (error) return { error: toMessage(error.message) };
  }

  return { error: null };
};

/** Soft-delete: deactivates the activity (and hides it from customers) without touching history. */
export const setActivityActive = async (
  activityId: string,
  isActive: boolean,
): Promise<{ error: string | null }> => {
  const { error } = await supabase.from("activities").update({ is_active: isActive }).eq("id", activityId);
  return { error: error ? toMessage(error.message) : null };
};