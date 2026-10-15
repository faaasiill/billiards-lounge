import { CLUB_INFO, phoneHref } from "../info/clubInfo";
import {
  absoluteUrl,
  ADDRESS_COUNTRY,
  ADDRESS_LOCALITY,
  ADDRESS_REGION,
  getPage,
  MAP,
  OG_IMAGE,
  OPENING_HOURS,
  SITE_LOCALE,
  SITE_NAME,
  type PageId,
} from "./siteConfig";

const BUSINESS_ID = () => absoluteUrl("/#business");
const SITE_ID = () => absoluteUrl("/#website");

const localBusiness = () => ({
  "@type": ["SportsActivityLocation", "EntertainmentBusiness"],
  "@id": BUSINESS_ID(),
  name: CLUB_INFO.name,
  description:
    "Premium entertainment destination by the riverside of Edasserikadavu with snooker and 8-ball billiards, chess, PS5 gaming and a premium café.",
  url: absoluteUrl("/"),
  image: OG_IMAGE,
  telephone: phoneHref.replace(/^tel:/, ""),
  email: CLUB_INFO.email,
  address: {
    "@type": "PostalAddress",
    streetAddress: CLUB_INFO.address,
    addressLocality: ADDRESS_LOCALITY,
    addressRegion: ADDRESS_REGION,
    addressCountry: ADDRESS_COUNTRY,
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: MAP.latitude,
    longitude: MAP.longitude,
  },
  hasMap: MAP.directionsUrl,
  sameAs: [MAP.listingShareUrl],
  ...(OPENING_HOURS.length > 0 && {
    openingHoursSpecification: OPENING_HOURS.map((range) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: range.days,
      opens: range.opens,
      closes: range.closes,
    })),
  }),
  amenityFeature: ["Billiards", "Snooker", "8-Ball", "Chess", "PS5", "Café"].map((name) => ({
    "@type": "LocationFeatureSpecification",
    name,
    value: true,
  })),
  potentialAction: {
    "@type": "ReserveAction",
    target: { "@type": "EntryPoint", urlTemplate: absoluteUrl("/book") },
    result: { "@type": "Reservation", name: "Table reservation" },
  },
});

const webSite = () => ({
  "@type": "WebSite",
  "@id": SITE_ID(),
  url: absoluteUrl("/"),
  name: SITE_NAME,
  inLanguage: SITE_LOCALE.replace("_", "-"),
  publisher: { "@id": BUSINESS_ID() },
});

const WEB_PAGE_TYPE: Record<PageId, string> = {
  home: "WebPage",
  about: "AboutPage",
  contact: "ContactPage",
  location: "WebPage",
  booking: "WebPage",
  myBookings: "WebPage",
};

/** One JSON-LD @graph per page: business, website, the page itself and breadcrumbs. */
export const pageGraph = (page: PageId) => {
  const meta = getPage(page);
  const url = absoluteUrl(meta.path);

  const graph: object[] = [
    localBusiness(),
    webSite(),
    {
      "@type": WEB_PAGE_TYPE[page],
      "@id": `${url}#webpage`,
      url,
      name: meta.title,
      description: meta.description,
      isPartOf: { "@id": SITE_ID() },
      about: { "@id": BUSINESS_ID() },
      ...(page !== "home" && { breadcrumb: { "@id": `${url}#breadcrumb` } }),
    },
  ];

  if (page !== "home") {
    graph.push({
      "@type": "BreadcrumbList",
      "@id": `${url}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
        { "@type": "ListItem", position: 2, name: meta.h1, item: url },
      ],
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
};