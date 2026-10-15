import { useEffect } from "react";
import { pageGraph } from "./structuredData";
import {
  absoluteUrl,
  getPage,
  OG_IMAGE,
  OG_IMAGE_ALT,
  SITE_LOCALE,
  SITE_NAME,
  SITE_URL,
  type PageId,
} from "./siteConfig";

const LD_ID = "ld-json-page";

const setMeta = (attr: "name" | "property", key: string, content: string) => {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
};

const setCanonical = (href: string) => {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
};

const ROBOTS_INDEX = "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1";

type SeoProps = { page: PageId };

/**
 * Keeps <title>, meta description, canonical, robots, Open Graph, Twitter and JSON-LD in sync
 * with the current view. Renders nothing. Static copies of the same tags are written into
 * each route's HTML at build time (scripts/prerender-meta.mjs) for crawlers that skip JS.
 */
const Seo = ({ page }: SeoProps) => {
  useEffect(() => {
    const meta = getPage(page);
    const url = SITE_URL ? absoluteUrl(meta.path) : "";

    document.title = meta.title;
    setMeta("name", "description", meta.description);
    setMeta("name", "robots", meta.index ? ROBOTS_INDEX : "noindex,follow");

    setMeta("property", "og:type", "website");
    setMeta("property", "og:site_name", SITE_NAME);
    setMeta("property", "og:locale", SITE_LOCALE);
    setMeta("property", "og:title", meta.title);
    setMeta("property", "og:description", meta.description);
    setMeta("property", "og:image", OG_IMAGE);
    setMeta("property", "og:image:alt", OG_IMAGE_ALT);

    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", meta.title);
    setMeta("name", "twitter:description", meta.description);
    setMeta("name", "twitter:image", OG_IMAGE);

    if (url) {
      setCanonical(url);
      setMeta("property", "og:url", url);
    }

    // Structured data is only emitted once the real site URL is known (absolute @id / url).
    let script = document.getElementById(LD_ID) as HTMLScriptElement | null;
    if (SITE_URL && meta.index) {
      if (!script) {
        script = document.createElement("script");
        script.id = LD_ID;
        script.type = "application/ld+json";
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(pageGraph(page));
    } else if (script) {
      script.remove();
    }
  }, [page]);

  return null;
};

export default Seo;