import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

/**
 * True only when the current Supabase session belongs to an admin, as
 * confirmed by the database `is_admin()` function (same check the admin
 * panel uses). Defaults to false, so nothing is shown while checking,
 * when logged out, for normal users, or if the check fails.
 *
 * This only controls whether a link is visible. Real protection is still
 * ProtectedRoute + Row Level Security. Unlike useAdminAuth, this never
 * signs anyone out and works outside AdminAuthProvider.
 */
export const useIsAdmin = (): boolean => {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const check = async (hasSession: boolean) => {
      if (!hasSession) {
        if (!cancelled) setIsAdmin(false);
        return;
      }

      const { data, error } = await supabase.rpc("is_admin");
      if (!cancelled) setIsAdmin(!error && data === true);
    };

    void supabase.auth.getSession().then(({ data }) => check(Boolean(data.session)));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      // Defer: awaiting Supabase calls directly inside this callback can deadlock.
      window.setTimeout(() => void check(Boolean(session)), 0);
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  return isAdmin;
};