// Writes public/sitemap.xml and public/robots.txt from src/modules/seo/pages.json.
// Runs before `vite build` (see package.json "seo:pre").
import { mkdir, readFile, writeFile } from "node:fs/promises";

const site = (process.env.VITE_SITE_URL ?? "").replace(/\/+$/, "");
if (!/^https?:\/\/[^/]+/.test(site)) {
  console.error(
    "[seo] VITE_SITE_URL is missing or invalid (expected e.g. https://yourdomain.com). " +
      "Set it in .env.production or in your host's environment variables.",
  );
  process.exit(1);
}

const { pages } = JSON.parse(
  await readFile(new URL("../src/modules/seo/pages.json", import.meta.url), "utf8"),
);

const today = new Date().toISOString().slice(0, 10);
const urls = pages
  .filter((p) => p.index)
  .map((p) => `  <url>\n    <loc>${site}${p.path}</loc>\n    <lastmod>${today}</lastmod>\n  </url>`)
  .join("\n");

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

// Deliberately no "Disallow" for /book or /my-bookings: those pages carry a noindex tag, and
// crawlers can only see that tag if they are allowed to fetch the page.
const robots = `User-agent: *\nAllow: /\n\nSitemap: ${site}/sitemap.xml\n`;

const publicDir = new URL("../public/", import.meta.url);
await mkdir(publicDir, { recursive: true });
await writeFile(new URL("sitemap.xml", publicDir), sitemap);
await writeFile(new URL("robots.txt", publicDir), robots);

console.log(`[seo] wrote public/sitemap.xml (${pages.filter((p) => p.index).length} URLs) and public/robots.txt for ${site}`);