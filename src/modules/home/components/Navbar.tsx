import { useEffect, useState } from "react";

import logo from "../../../assets/logo design1.png";
import { useTheme } from "../../../context/ThemeContext";

type NavbarProps = {
  /** Brand-pill mode: shown on the homepage and top of the booking flow. */
  brand?: string;

  /** Makes the brand pill tappable — used to exit the booking flow back home. */
  onBrandClick?: () => void;

  /** Switches to back-chevron mode. */
  onBack?: () => void;

  title?: string;

  /** Opens the booking flow from the dropdown. */
  onBookNow?: () => void;
};

const NAV_LINKS = ["About Us", "Contact Us", "Location"];

const iconProps = {
  width: 15,
  height: 15,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const SunIcon = () => (
  <svg {...iconProps}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </svg>
);

const MoonIcon = () => (
  <svg {...iconProps}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
  </svg>
);

const BackIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m15 6-6 6 6 6" />
  </svg>
);

const circleButtonClass =
  "flex h-10 w-10 items-center justify-center rounded-full border border-ivory/15 text-ivory transition-all duration-200 hover:border-ivory/30 active:scale-90 active:bg-ivory/10 light:border-felt-dark/15 light:text-felt-dark light:hover:border-felt-dark/30 light:active:bg-felt-dark/10";

const Navbar = ({
  brand = "Billiards lounge",
  onBrandClick,
  onBack,
  title,
  onBookNow,
}: NavbarProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (!menuOpen) return;

    const id = requestAnimationFrame(() => {
      setMenuVisible(true);
    });

    return () => cancelAnimationFrame(id);
  }, [menuOpen]);

  const openMenu = () => {
    setMenuOpen(true);
  };

  const closeMenu = () => {
    setMenuVisible(false);

    window.setTimeout(() => {
      setMenuOpen(false);
    }, 280);
  };

  const toggleMenu = () => {
    if (menuOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  };

  const BrandTag = onBrandClick ? "button" : "div";

  return (
    <>
      {/*
        Genuinely transparent: no bg-* utility, no inline background, no
        wrapper, pseudo-element or shadow behind it. Whatever the current
        page root renders (bg-felt / light:bg-cream) shows straight through.
        This previously *looked* like it had a background on the booking
        screens because those screens never received the `data-theme`
        attribute, so every `light:` class in the tree — including on
        elements sitting near the navbar — silently failed and kept
        rendering dark-mode colors against a light page. That's fixed at
        the source in ThemeContext now; this header just stays unstyled.
      */}
      <header className="relative z-50 px-6 pb-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <div className="mx-auto flex w-full items-center justify-between gap-3">
          {/* Back mode */}
          {onBack ? (
            <div className="flex min-w-0 items-center gap-3 animate-[fade-slide-up_280ms_ease-out]">
              <button
                onClick={onBack}
                aria-label="Go back"
                className={circleButtonClass}
              >
                <BackIcon />
              </button>

              {title && (
                <span className="truncate font-display text-base tracking-[-0.04em] text-ivory light:text-felt-dark">
                  {title}
                </span>
              )}
            </div>
          ) : (
            /* Logo + Brand */
            <BrandTag
              onClick={onBrandClick}
              className="flex h-10 items-center gap-1.5 rounded-full bg-ivory px-1.5 py-1.5 transition-transform duration-200 active:scale-95 light:bg-felt-dark"
            >
              <img
                src={logo}
                alt={brand}
                className="h-7 w-7 rounded-full object-cover"
              />

              <span className="pr-1.5 text-xs font-medium tracking-tighter text-felt-dark light:text-ivory">
                {brand}
              </span>
            </BrandTag>
          )}

          {/* Hamburger */}
          <button
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={toggleMenu}
            className={circleButtonClass}
          >
            <span className="relative block h-4 w-4">
              <span
                className={`absolute left-0 top-1 h-[1.5px] w-4 bg-current transition-all duration-300 ease-out ${
                  menuVisible ? "top-[7px] rotate-45" : ""
                }`}
              />

              <span
                className={`absolute left-0 top-[7px] h-[1.5px] w-4 bg-current transition-opacity duration-200 ${
                  menuVisible ? "opacity-0" : "opacity-100"
                }`}
              />

              <span
                className={`absolute bottom-1 left-0 h-[1.5px] w-4 bg-current transition-all duration-300 ease-out ${
                  menuVisible ? "bottom-[7px] -rotate-45" : ""
                }`}
              />
            </span>
          </button>
        </div>

        {/* Dropdown */}
        {menuOpen && (
          <>
            {/* Backdrop */}
            <button
              aria-label="Close menu backdrop"
              onClick={closeMenu}
              className={`fixed inset-0 z-40 bg-felt-dark/60 transition-opacity duration-300 ease-out ${
                menuVisible ? "opacity-100" : "opacity-0"
              }`}
            />

            {/* Dropdown panel */}
            <div
              className={`absolute right-6 top-[calc(100%+0.5rem)] z-50 w-56 overflow-hidden rounded-4xl border border-ivory/10 bg-felt-dark shadow-md shadow-black/30 transition-all duration-300 ease-out light:border-felt-dark/10 light:bg-ivory ${
                menuVisible
                  ? "translate-y-0 scale-100 opacity-100"
                  : "-translate-y-2 scale-95 opacity-0"
              }`}
            >
              <div className="p-3">
                {/* Navigation links */}
                {NAV_LINKS.map((label) => (
                  <button
                    key={label}
                    onClick={closeMenu}
                    className="block w-full rounded-full px-4 py-2.5 text-left text-sm tracking-tight text-ivory transition-colors active:bg-ivory/10 light:text-felt-dark light:active:bg-felt-dark/10"
                  >
                    {label}
                  </button>
                ))}

                {/* Theme toggle */}
                <button
                  onClick={toggleTheme}
                  aria-pressed={theme === "light"}
                  className="mt-1 flex w-full items-center justify-between rounded-full border border-sage/30 px-4 py-2.5 text-left text-sm tracking-tight text-ivory transition-colors active:bg-ivory/10 light:border-sage-dark/40 light:text-felt-dark light:active:bg-felt-dark/10"
                >
                  <span>
                    {theme === "dark" ? "Light mode" : "Dark mode"}
                  </span>

                  <span className="flex h-5 w-5 items-center justify-center">
                    {theme === "dark" ? <SunIcon /> : <MoonIcon />}
                  </span>
                </button>

                {/* Login */}
                <button
                  onClick={() => {
                    setIsAuthenticated((value) => !value);
                    closeMenu();
                  }}
                  className="mt-1 block w-full rounded-full border border-sage/30 px-4 py-2.5 text-left text-sm tracking-tight text-ivory transition-colors active:bg-ivory/10 light:border-sage-dark/40 light:text-felt-dark light:active:bg-felt-dark/10"
                >
                  {isAuthenticated ? "Logout" : "Login"}
                </button>

                {/* Book Now */}
                <button
                  onClick={() => {
                    closeMenu();
                    onBookNow?.();
                  }}
                  className="mt-2 block w-full rounded-full bg-brass px-4 py-2.5 text-left text-sm font-medium tracking-tight text-felt-dark transition-transform active:scale-[0.98]"
                >
                  Book Now
                </button>
              </div>
            </div>
          </>
        )}
      </header>
    </>
  );
};

export default Navbar;