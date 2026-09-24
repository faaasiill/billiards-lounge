import { useEffect, useRef, useState } from "react";
import { useAdminAuth } from "../context/AdminAuthContext";
import { useAdminRoute } from "../hooks/useAdminRoute";
import { LogoutIcon, MenuIcon } from "./icons";
import Spinner from "./Spinner";

type AdminHeaderProps = {
  title: string;
  onMenuClick: () => void;
};

const initialsOf = (value: string) =>
  value.trim().slice(0, 1).toUpperCase() || "A";

const AdminHeader = ({ title, onMenuClick }: AdminHeaderProps) => {
  const { user, signOut } = useAdminAuth();
  const { navigate } = useAdminRoute();

  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    const onPointerDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const handleSignOut = async () => {
    setSigningOut(true);
    setError(null);
    const { error: signOutError } = await signOut();

    if (signOutError) {
      setError(signOutError);
      setSigningOut(false);
      return;
    }

    setMenuOpen(false);
    navigate("/admin-login", { replace: true });
  };

  const email = user?.email ?? "";
  const avatarUrl =
    typeof user?.user_metadata?.avatar_url === "string"
      ? user.user_metadata.avatar_url
      : null;
  const displayName =
    (typeof user?.user_metadata?.full_name === "string" &&
      user.user_metadata.full_name) ||
    email;

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-3 pt-[env(safe-area-inset-top)] sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-600 hover:bg-neutral-100 lg:hidden"
        >
          <MenuIcon />
        </button>
        <h1 className="truncate text-base font-semibold tracking-tight text-neutral-900">
          {title}
        </h1>
      </div>

      <div ref={menuRef} className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3 hover:bg-neutral-100"
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              referrerPolicy="no-referrer"
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 text-xs font-semibold text-white">
              {initialsOf(displayName)}
            </span>
          )}
          <span className="hidden max-w-40 truncate text-sm text-neutral-700 sm:block">
            {displayName}
          </span>
        </button>

        {menuOpen && (
          <div
            role="menu"
            className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(16rem,calc(100vw-1.5rem))] rounded-xl border border-neutral-200 bg-white p-2 shadow-lg"
          >
            <div className="border-b border-neutral-100 px-3 pb-2.5 pt-1.5">
              <p className="truncate text-sm font-medium text-neutral-900">
                {displayName}
              </p>
              {email && displayName !== email && (
                <p className="truncate text-xs text-neutral-500">{email}</p>
              )}
            </div>

            <button
              type="button"
              role="menuitem"
              onClick={() => void handleSignOut()}
              disabled={signingOut}
              className="mt-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 disabled:opacity-60"
            >
              {signingOut ? <Spinner /> : <LogoutIcon />}
              {signingOut ? "Signing out…" : "Sign out"}
            </button>

            {error && (
              <p role="alert" className="px-3 pb-1 pt-2 text-xs text-red-600">
                {error}
              </p>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default AdminHeader;