import { supabase } from "../../../lib/supabase";

export type AdminRecord = {
  user_id: string;
  email: string;
  created_at: string;
};

const ERROR_MESSAGES: Record<string, string> = {
  not_authorized: "You don't have permission to do that.",
  invalid_email: "Enter a valid email address.",
  user_not_found:
    "No account exists with that email. Create the user in Supabase first (Authentication → Users), then add them here.",
  already_admin: "That user is already an admin.",
  cannot_remove_self: "You can't remove your own admin access.",
  last_admin: "You can't remove the last remaining admin.",
  email_exists: "An account with that email already exists. Use \"Add admin\" instead.",
  weak_password: "Password must be at least 8 characters.",
};

const toMessage = (raw: string | undefined): string => {
  if (!raw) return "Something went wrong. Please try again.";
  const key = Object.keys(ERROR_MESSAGES).find((k) => raw.includes(k));
  return key ? ERROR_MESSAGES[key] : "Something went wrong. Please try again.";
};

export const listAdmins = async (): Promise<{ data: AdminRecord[]; error: string | null }> => {
  const { data, error } = await supabase
    .from("admins")
    .select("user_id, email, created_at")
    .order("created_at", { ascending: true });

  if (error) return { data: [], error: "Couldn't load admins. Please try again." };
  return { data: (data ?? []) as AdminRecord[], error: null };
};

/** Grants admin access to an EXISTING user account by email (unchanged flow). */
export const addAdminByEmail = async (email: string): Promise<{ error: string | null }> => {
  const { error } = await supabase.rpc("add_admin_by_email", { target_email: email });
  return { error: error ? toMessage(error.message) : null };
};

export const removeAdmin = async (userId: string): Promise<{ error: string | null }> => {
  const { error } = await supabase.rpc("remove_admin", { target_user_id: userId });
  return { error: error ? toMessage(error.message) : null };
};

/**
 * Creates a BRAND NEW user account and grants it admin access in one step,
 * so an authorized admin never has to touch the Supabase dashboard.
 *
 * This calls the `create-admin` Supabase Edge Function, which is the only
 * place allowed to use the service-role key (creating auth users requires
 * elevated privileges the browser must never hold). The function itself
 * re-verifies — via the caller's JWT — that the requester is already an
 * admin before creating anything, so a non-admin calling this endpoint
 * directly gets rejected server-side regardless of what the UI shows.
 */
export const createAdminAccount = async (
  email: string,
  password: string,
  fullName?: string,
): Promise<{ error: string | null }> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return { error: "Your session has expired. Please sign in again." };

  const { data, error } = await supabase.functions.invoke("create-admin", {
    body: { email, password, full_name: fullName ?? null },
  });

  if (error) {
    // FunctionsHttpError carries the response body separately; try to surface it.
    const context = (error as { context?: { json?: () => Promise<{ error?: string }> } }).context;
    if (context?.json) {
      try {
        const body = await context.json();
        return { error: toMessage(body?.error) };
      } catch {
        // fall through to generic message below
      }
    }
    return { error: toMessage(error.message) };
  }

  if (data?.error) return { error: toMessage(data.error) };

  return { error: null };
};