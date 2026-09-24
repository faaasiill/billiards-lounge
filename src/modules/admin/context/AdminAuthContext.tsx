import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "../../../lib/supabase";

type AuthResult = {
  error: string | null;
};

type AdminAuthContextValue = {
  session: Session | null;
  user: User | null;

  /**
   * True during the initial session restore.
   */
  loading: boolean;

  /**
   * True while we're asking the database whether this user is an admin.
   */
  checkingAdmin: boolean;

  /**
   * Result of the database `is_admin()` check for the current user.
   */
  isAdmin: boolean;

  /**
   * Set when a signed-in user was rejected for not being an admin.
   */
  accessDenied: boolean;

  signInWithPassword: (
    email: string,
    password: string,
  ) => Promise<AuthResult>;

  signInWithGoogle: () => Promise<AuthResult>;

  signOut: () => Promise<AuthResult>;
};

const AdminAuthContext = createContext<
  AdminAuthContextValue | undefined
>(undefined);

const friendlyMessage = (message: string): string => {
  const m = message.toLowerCase();

  if (m.includes("invalid login credentials")) {
    return "Incorrect email or password.";
  }

  if (m.includes("email not confirmed")) {
    return "Please confirm your email before signing in.";
  }

  if (m.includes("rate limit") || m.includes("too many")) {
    return "Too many attempts. Please wait a moment and try again.";
  }

  if (m.includes("failed to fetch") || m.includes("network")) {
    return "Network error. Check your connection and try again.";
  }

  return "Something went wrong. Please try again.";
};

export const AdminAuthProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [session, setSession] = useState<Session | null>(null);

  const [loading, setLoading] = useState(true);

  const [checkingAdmin, setCheckingAdmin] = useState(false);

  const [isAdmin, setIsAdmin] = useState(false);

  const [accessDenied, setAccessDenied] = useState(false);

  /*
   * Restore the session and keep it in sync with Supabase Auth.
   */
  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      const { data } = await supabase.auth.getSession();

      if (!active) return;

      setSession(data.session);
      setLoading(false);
    };

    void restoreSession();

    const {
      data: listener,
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;

      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const userId = session?.user?.id ?? null;

  /*
   * Ask the database whether the current user is an admin.
   *
   * This runs whenever the authenticated user changes.
   */
  useEffect(() => {
    let cancelled = false;

    if (!userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsAdmin(false);
      setCheckingAdmin(false);
      setAccessDenied(false);
      return;
    }

    setCheckingAdmin(true);
    setAccessDenied(false);

    const checkAdmin = async () => {
      const { data, error } = await supabase.rpc("is_admin");

      if (cancelled) return;

      /*
       * Database/network error:
       *
       * Do NOT treat an RPC failure as proof that the user
       * is not an admin.
       */
      if (error) {
        console.error("Admin check failed:", error);

        setIsAdmin(false);
        setCheckingAdmin(false);

        return;
      }

      const admin = data === true;

      setIsAdmin(admin);
      setCheckingAdmin(false);

      /*
       * The database explicitly says this user is not an admin.
       */
      if (!admin) {
        setAccessDenied(true);

        await supabase.auth.signOut();
      }
    };

    void checkAdmin();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  /*
   * Email/password login.
   */
  const signInWithPassword = useCallback(
    async (
      email: string,
      password: string,
    ): Promise<AuthResult> => {
      setAccessDenied(false);

      const { error } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      return {
        error: error
          ? friendlyMessage(error.message)
          : null,
      };
    },
    [],
  );

  /*
   * Google OAuth login.
   *
   * Google -> Supabase callback
   * -> http://localhost:5173/#/admin
   * -> ProtectedRoute
   * -> is_admin()
   */
  const signInWithGoogle = useCallback(
    async (): Promise<AuthResult> => {
      setAccessDenied(false);

      const { error } =
        await supabase.auth.signInWithOAuth({
          provider: "google",

          options: {
            redirectTo: `${window.location.origin}/#/admin`,

            queryParams: {
              prompt: "select_account",
            },
          },
        });

      return {
        error: error
          ? friendlyMessage(error.message)
          : null,
      };
    },
    [],
  );

  /*
   * Sign out.
   */
  const signOut = useCallback(
    async (): Promise<AuthResult> => {
      const { error } = await supabase.auth.signOut();

      if (!error) {
        setAccessDenied(false);
        setIsAdmin(false);
      }

      return {
        error: error
          ? friendlyMessage(error.message)
          : null,
      };
    },
    [],
  );

  const value = useMemo<AdminAuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,

      loading,
      checkingAdmin,

      isAdmin,
      accessDenied,

      signInWithPassword,
      signInWithGoogle,
      signOut,
    }),
    [
      session,
      loading,
      checkingAdmin,
      isAdmin,
      accessDenied,
      signInWithPassword,
      signInWithGoogle,
      signOut,
    ],
  );

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAdminAuth = () => {
  const ctx = useContext(AdminAuthContext);

  if (!ctx) {
    throw new Error(
      "useAdminAuth must be used within an AdminAuthProvider",
    );
  }

  return ctx;
};