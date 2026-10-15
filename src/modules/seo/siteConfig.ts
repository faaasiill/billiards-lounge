import data from "./pages.json";

export type PageId = "home" | "booking" | "myBookings" | "about" | "contact" | "location";

export type PageMeta = {
  id: PageId;
  path: string;
  title: string;
  description: string;
  h1: string;
  /** false → rendered with `noindex,follow` and left out of the sitemap. */
  index: boolean;
};

export const PAGES = data.pages as PageMeta[];
export const getPage = (id: PageId): PageMeta => PAGES.find((p) => p.id === id) ?? PAGES[0];

export const SITE_NAME = data.siteName;
export const SITE_LOCALE = data.locale;
export const OG_IMAGE = data.ogImage;
export const OG_IMAGE_ALT = data.ogImageAlt;

/**
 * Public origin of the deployed site, e.g. https://billiardslounge.in (no trailing slash).
 * Set VITE_SITE_URL in your hosting dashboard / .env.production. Canonical tags, Open Graph
 * URLs and structured data are only emitted once it is set, so a wrong URL never ships.
 */
const siteURL = "https://billiardslounge.site/";
export const SITE_URL = ((siteURL as string | undefined) ?? "").replace(/\/+$/, "");
export const absoluteUrl = (path: string) => `${SITE_URL}${path}`;

/** Google Maps details for the club (from the Maps embed / listing). */
export const MAP = {
  /** Opens the Google Maps listing with directions available. */
  directionsUrl: "https://maps.google.com/?cid=3820823758101300760",
  /** Short share link of the Google Business listing. */
  listingShareUrl: "https://share.google/CFhINWuAl76hv1EIu",
  embedUrl:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d31305.71095600643!2d75.96430063247682!3d11.245671718721525!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba6475aea2f0849%3A0x35064af6e3004618!2sbilliards%20lounge!5e0!3m2!1sen!2sin!4v1792044374692!5m2!1sen!2sin",
  /** Map-centre coordinates taken from the embed. Verify against the pin on Google Maps. */
  latitude: 11.245671718721525,
  longitude: 75.96430063247682,
} as const;

export const ADDRESS_LOCALITY = "Edasserikadavu";
export const ADDRESS_REGION = "Kerala";
export const ADDRESS_COUNTRY = "IN";

export type Weekday =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

export type OpeningRange = {
  days: Weekday[];
  /** 24-hour "HH:MM". Use closes "00:00" for midnight. */
  opens: string;
  closes: string;
};

/**
 * Opening hours. Fill in the real hours: they appear on the Location and Contact pages and in
 * the Google structured data. While empty, nothing is shown (no placeholder text).
 *
 * Example:
 *   { days: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"], opens: "10:00", closes: "23:00" }
 */
export const OPENING_HOURS: OpeningRange[] = [];