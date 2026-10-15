import { PAGES } from "./siteConfig";

/** Maps an app view id ("about", "booking", …) to its public URL path. */
export const viewToPath = (view: string): string => PAGES.find((p) => p.id === view)?.path ?? "/";

/** Maps a URL pathname to an app view id; unknown paths fall back to "home". */
export const pathToView = (pathname: string): string => {
  const clean = pathname.replace(/\/+$/, "").toLowerCase() || "/";
  return PAGES.find((p) => p.path === clean)?.id ?? "home";
};