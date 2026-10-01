/**
 * Public club details used by the About, Contact and Location pages.
 * Edit values here; nothing else needs to change.
 */
export const CLUB_INFO = {
  name: "Billiards Lounge",

  /** Shown on screen. */
  phoneDisplay: "073060 10124",
  /** Used for tel: links (international format, no spaces). */
  phoneTel: "+917306010124",
  /** WhatsApp wa.me format: country code + number, digits only. */
  whatsappNumber: "917306010124",
  whatsappGreeting: "Hi Billiards Lounge, I'd like to know more.",

  email: "billiardsloungebl@gmail.com",

  address: "Edasherikadavu, Kizhuparamba, Kerala, India – 673639",
  landmark: "Near the riverside of Edasserikadavu",

  /**
   * GOOGLE MAPS LINK — paste the URL here once the listing is verified,
   * e.g. "https://maps.app.goo.gl/xxxxxxxx".
   * While this is empty (or not an http/https URL), the Location page shows
   * a "directions coming soon" state instead of a Get Directions button.
   */
  googleMapsUrl: "",
} as const;

/** True only when a usable http(s) Maps link has been configured. */
export const hasMapsLink = /^https?:\/\/\S+$/i.test(CLUB_INFO.googleMapsUrl.trim());

export const phoneHref = `tel:${CLUB_INFO.phoneTel}`;
export const emailHref = `mailto:${CLUB_INFO.email}`;
export const whatsappHref = `https://wa.me/${CLUB_INFO.whatsappNumber}?text=${encodeURIComponent(
  CLUB_INFO.whatsappGreeting,
)}`;