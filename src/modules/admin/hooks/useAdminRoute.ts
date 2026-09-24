import { useCallback, useEffect, useState } from "react";

const normalize = (hash: string): string => {
  const path = hash.replace(/^#/, "").split("?")[0];
  return path === "" ? "/" : path.replace(/\/+$/, "") || "/";
};

const read = () => normalize(window.location.hash);

/** Custom event so every hook instance re-reads the hash after a programmatic navigation. */
const NAV_EVENT = "admin:navigate";

/**
 * Minimal hash router scoped to the admin panel. Keeps the public app
 * untouched (no react-router required) while still giving the admin
 * deep-linkable, back-button-friendly URLs like /#/admin/bookings.
 */
export const useAdminRoute = () => {
  const [path, setPath] = useState(read);

  useEffect(() => {
    const sync = () => setPath(read());

    window.addEventListener("hashchange", sync);
    window.addEventListener("popstate", sync);
    window.addEventListener(NAV_EVENT, sync);

    // Catch any change that happened between first render and effect setup.
    sync();

    return () => {
      window.removeEventListener("hashchange", sync);
      window.removeEventListener("popstate", sync);
      window.removeEventListener(NAV_EVENT, sync);
    };
  }, []);

  const navigate = useCallback((to: string, options?: { replace?: boolean }) => {
    const url = `${window.location.pathname}${window.location.search}#${to}`;

    if (options?.replace) {
      window.history.replaceState(null, "", url);
    } else {
      window.history.pushState(null, "", url);
    }

    // replaceState / pushState do NOT fire hashchange, so notify manually.
    // Also dispatch hashchange so App.tsx's listener (which decides whether
    // to render the admin app at all) stays in sync.
    window.dispatchEvent(new Event(NAV_EVENT));
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  }, []);

  return { path, navigate };
};

/** True when the current hash belongs to the admin area. */
export const isAdminPath = (hash: string): boolean => {
  const p = normalize(hash);
  return p === "/admin" || p.startsWith("/admin/") || p === "/admin-login";
};