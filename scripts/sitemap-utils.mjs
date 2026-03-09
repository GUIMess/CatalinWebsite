import fs from "node:fs/promises";
import path from "node:path";

const defaultSiteUrl = "https://www.catalinsiegling.com";
const staticPaths = ["/", "/playground", "/work", "/lab-log", "/contact"];

function cleanBaseUrl(url) {
  return url.replace(/\/+$/, "");
}

function escapeXml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function loadWorkItems(projectRoot = process.cwd()) {
  const workPath = path.resolve(projectRoot, "src", "content", "work.json");
  const raw = await fs.readFile(workPath, "utf8");
  return JSON.parse(raw);
}

export function buildSitemapPaths(workItems) {
  const workPaths = workItems.map((item) => `/work/${item.slug}`);
  return Array.from(new Set([...staticPaths, ...workPaths]));
}

export function buildSitemapXml(siteUrl, paths) {
  const baseUrl = cleanBaseUrl(siteUrl || defaultSiteUrl);
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
  ];

  for (const routePath of paths) {
    const normalizedPath = routePath === "/" ? "/" : routePath.replace(/\/+$/, "");
    const location = normalizedPath === "/" ? `${baseUrl}/` : `${baseUrl}${normalizedPath}`;
    lines.push("  <url>");
    lines.push(`    <loc>${escapeXml(location)}</loc>`);
    lines.push("  </url>");
  }

  lines.push("</urlset>");
  return `${lines.join("\n")}\n`;
}

export async function generateSitemap(projectRoot = process.cwd(), siteUrl = process.env.VITE_SITE_URL || defaultSiteUrl) {
  const workItems = await loadWorkItems(projectRoot);
  const paths = buildSitemapPaths(workItems);
  const sitemapXml = buildSitemapXml(siteUrl, paths);
  const sitemapPath = path.resolve(projectRoot, "public", "sitemap.xml");

  await fs.writeFile(sitemapPath, sitemapXml, "utf8");
  return { paths, sitemapPath };
}
