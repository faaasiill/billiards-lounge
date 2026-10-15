import { MAP } from "../../seo/siteConfig";

type MapEmbedProps = {
  /** Accessible title for the iframe (also read by crawlers). */
  title?: string;
  className?: string;
};

/** Google Maps embed for the club, lazy-loaded so it never blocks first paint. */
const MapEmbed = ({ title = "Billiards Lounge on Google Maps", className = "" }: MapEmbedProps) => (
  <div
    className={`overflow-hidden rounded-3xl border border-ivory/10 light:border-felt-dark/10 ${className}`}
  >
    <iframe
      src={MAP.embedUrl}
      title={title}
      className="block h-72 w-full border-0"
      loading="lazy"
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen
    />
  </div>
);

export default MapEmbed;