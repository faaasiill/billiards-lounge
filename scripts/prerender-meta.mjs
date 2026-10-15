// After `vite build`: writes one HTML file per route (dist/about.html, dist/contact.html, …)
// with that route's own <title>, description, canonical, robots and Open Graph tags plus a
// <noscript> text fallback. Crawlers and link-preview bots that do not run JavaScript
// (WhatsApp, Facebook, Telegram, many SEO tools) then see correct per-page metadata.
import { readFile, writeFile } from "node:fs/promises";

const site = (process.env.VITE_SITE_URL ?? "").replace(/\/+$/, "");
if (!/^https?:\/\/[^/]+/.test(site)) {
  console.error("[seo] VITE_SITE_URL is missing or invalid; cannot write canonical URLs.");
  process.exit(1);
}

const data = JSON.parse(await readFile(new URL("../src/modules/seo/pages.json", import.meta.url), "utf8"));
const distDir = new URL("../dist/", import.meta.url);
const template = await readFile(new URL("index.html", distDir), "utf8");

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const ROBOTS_INDEX = "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1";

// Tags this script owns; any copy already in index.html is stripped first to avoid duplicates.
const STRIP = [
  /<title>[\s\S]*?<\/title>\s*/gi,
  /<meta\s+name=["']description["'][^>]*>\s*/gi,
  /<meta\s+name=["']robots["'][^>]*>\s*/gi,
  /<meta\s+property=["']og:[^"']*["'][^>]*>\s*/gi,
  /<meta\s+name=["']twitter:[^"']*["'][^>]*>\s*/gi,
  /<link\s+rel=["']canonical["'][^>]*>\s*/gi,
];

const build = (page) => {
  const url = `${site}${page.path}`;
  const head = [
    `<title>${esc(page.title)}</title>`,
    `<meta name="description" content="${esc(page.description)}" />`,
    `<meta name="robots" content="${page.index ? ROBOTS_INDEX : "noindex,follow"}" />`,
    `<link rel="canonical" href="${esc(url)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${esc(data.siteName)}" />`,
    `<meta property="og:locale" content="${esc(data.locale)}" />`,
    `<meta property="og:title" content="${esc(page.title)}" />`,
    `<meta property="og:description" content="${esc(page.description)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:image" content="${esc(data.ogImage)}" />`,
    `<meta property="og:image:alt" content="${esc(data.ogImageAlt)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(page.title)}" />`,
    `<meta name="twitter:description" content="${esc(page.description)}" />`,
    `<meta name="twitter:image" content="${esc(data.ogImage)}" />`,
  ].join("\n    ");

  const links = data.pages
    .filter((p) => p.index)
    .map((p) => `<li><a href="${p.path}">${esc(p.h1)}</a></li>`)
    .join("");
  const noscript = `<noscript><main><h1>${esc(page.h1)}</h1><p>${esc(page.description)}</p><nav><ul>${links}</ul></nav></main></noscript>`;

  let html = template;
  for (const re of STRIP) html = html.replace(re, "");
  html = html.replace("</head>", `    ${head}\n  </head>`);
  html = html.replace("</body>", `    ${noscript}\n  </body>`);
  return html;
};

for (const page of data.pages) {
  // "/" overwrites dist/index.html; "/about" becomes dist/about.html (served at /about).
  const file = page.path === "/" ? "index.html" : `${page.path.slice(1)}.html`;
  await writeFile(new URL(file, distDir), build(page));
  console.log(`[seo] wrote dist/${file}`);
}