import { generateSitemap } from "./sitemap-utils.mjs";

const { sitemapPath, paths } = await generateSitemap();
process.stdout.write(`[sitemap] Wrote ${paths.length} routes to ${sitemapPath}\n`);
