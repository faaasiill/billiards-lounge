import { useEffect, type ReactNode } from "react";
import { useAdminAuth } from "../context/AdminAuthContext";
import { useAdminRoute } from "../hooks/useAdminRoute";
import FullScreenLoader from "./FullScreenLoader";

type ProtectedRouteProps = { children: ReactNode };

/**
 * Gate for every admin screen.
 *  - no session               -> /admin-login
 *  - session but not an admin -> homepage (session is also ended by the auth context)
 *  - admin                    -> children
 * Nothing admin-related renders until the database has confirmed admin status.
 */
const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { session, loading, checkingAdmin, isAdmin, accessDenied } = useAdminAuth();
  const { navigate } = useAdminRoute();

  useEffect(() => {
    if (loading || checkingAdmin) return;

    if (accessDenied) {
      navigate("/", { replace: true });
      return;
    }

    if (!session) navigate("/admin-login", { replace: true });
  }, [loading, checkingAdmin, accessDenied, session, navigate]);

  if (loading) return <FullScreenLoader label="Checking your session…" />;
  if (session && checkingAdmin) return <FullScreenLoader label="Verifying access…" />;
  if (accessDenied) return <FullScreenLoader label="Redirecting…" />;
  if (!session) return <FullScreenLoader label="Redirecting to sign in…" />;
  if (!isAdmin) return <FullScreenLoader label="Verifying access…" />;

  return <>{children}</>;
};

export default ProtectedRoute;