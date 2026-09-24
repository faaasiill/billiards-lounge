import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import { useAdminAuth } from "../context/AdminAuthContext";
import { useAdminRoute } from "../hooks/useAdminRoute";

import {
  GoogleIcon,
  LockIcon,
} from "../components/icons";

import Spinner from "../components/Spinner";

const inputClass =
  "w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-base text-neutral-900 placeholder:text-neutral-400 outline-none transition focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 disabled:opacity-60 sm:text-sm";

const EMAIL_PATTERN =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LoginPage = () => {
  const {
    session,
    loading,
    checkingAdmin,
    isAdmin,
    accessDenied,
    signInWithPassword,
    signInWithGoogle,
  } = useAdminAuth();

  const { navigate } = useAdminRoute();

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const [googleLoading, setGoogleLoading] =
    useState(false);

  const [error, setError] = useState<string | null>(
    null,
  );

  /*
   * Send the user to the correct place once
   * authentication and admin verification are complete.
   */
  useEffect(() => {
    if (loading || checkingAdmin) return;

    /*
     * User is authenticated but is not an admin.
     */
    if (accessDenied) {
      navigate("/", { replace: true });
      return;
    }

    /*
     * User is authenticated and confirmed as admin.
     */
    if (session && isAdmin) {
      navigate("/admin", { replace: true });
    }
  }, [
    loading,
    checkingAdmin,
    accessDenied,
    session,
    isAdmin,
    navigate,
  ]);

  /*
   * Disable the form while:
   *
   * - email/password login is running
   * - Google login is running
   * - admin verification is running
   */
  const busy =
    submitting ||
    googleLoading ||
    checkingAdmin;

  /*
   * Email/password login.
   */
  const handleSubmit = async (
    e: FormEvent,
  ) => {
    e.preventDefault();

    if (busy) return;

    const trimmedEmail = email.trim();

    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters.",
      );
      return;
    }

    setError(null);
    setSubmitting(true);

    const {
      error: signInError,
    } = await signInWithPassword(
      trimmedEmail,
      password,
    );

    /*
     * If login failed, stop loading and show the error.
     *
     * If successful, Supabase will update the session
     * and the auth effect will handle the next step.
     */
    if (signInError) {
      setError(signInError);
      setSubmitting(false);
    }
  };

  /*
   * Google login.
   */
  const handleGoogle = async () => {
    if (busy) return;

    setError(null);
    setGoogleLoading(true);

    const {
      error: googleError,
    } = await signInWithGoogle();

    /*
     * On success the browser leaves this page
     * and goes to Google.
     *
     * If OAuth fails before navigation, show the error.
     */
    if (googleError) {
      setError(googleError);
      setGoogleLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-neutral-50 px-4 py-10 font-sans">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-neutral-900 text-white">
            <LockIcon
              width={20}
              height={20}
            />
          </span>

          <h1 className="text-xl font-semibold tracking-tight text-neutral-900">
            Admin sign in
          </h1>

          <p className="mt-1 text-sm text-neutral-500">
            Sign in to manage Billiards Lounge.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          {/* Google */}
          <button
            type="button"
            onClick={() => void handleGoogle()}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {googleLoading ? (
              <Spinner />
            ) : (
              <GoogleIcon />
            )}

            {googleLoading
              ? "Connecting…"
              : "Continue with Google"}
          </button>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-neutral-200" />

            <span className="text-xs text-neutral-400">
              or
            </span>

            <span className="h-px flex-1 bg-neutral-200" />
          </div>

          {/* Email/password */}
          <form
            onSubmit={(e) =>
              void handleSubmit(e)
            }
            noValidate
            className="flex flex-col gap-4"
          >
            {/* Email */}
            <div>
              <label
                htmlFor="admin-email"
                className="mb-1.5 block text-xs font-medium text-neutral-700"
              >
                Email
              </label>

              <input
                id="admin-email"
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                disabled={busy}
                placeholder="you@example.com"
                className={inputClass}
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="admin-password"
                className="mb-1.5 block text-xs font-medium text-neutral-700"
              >
                Password
              </label>

              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                disabled={busy}
                placeholder="••••••••"
                className={inputClass}
              />
            </div>

            {/* Error */}
            {error && (
              <p
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
              >
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting && <Spinner />}

              {submitting
                ? "Signing in…"
                : "Sign in"}
            </button>
          </form>
        </div>

        {/* Back */}
        <button
          type="button"
          onClick={() =>
            navigate("/", { replace: true })
          }
          className="mx-auto mt-6 block text-xs text-neutral-500 hover:text-neutral-800"
        >
          ← Back to website
        </button>
      </div>
    </div>
  );
};

export default LoginPage;