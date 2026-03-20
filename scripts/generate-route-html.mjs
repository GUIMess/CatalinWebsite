import fs from "node:fs/promises";
import path from "node:path";
import { loadWorkItems } from "./sitemap-utils.mjs";
import {
  applyPageMetaToHtml,
  buildNotFoundMeta,
  buildRouteMetaEntries,
  routePathToOutputPath
} from "./route-html-utils.mjs";

const projectRoot = process.cwd();
const distDir = path.resolve(projectRoot, "dist");
const templatePath = path.resolve(distDir, "index.html");
const siteUrl = process.env.VITE_SITE_URL;

const [templateHtml, workItems] = await Promise.all([
  fs.readFile(templatePath, "utf8"),
  loadWorkItems(projectRoot)
]);

const routeMetaEntries = buildRouteMetaEntries(workItems);

for (const entry of routeMetaEntries) {
  const outputPath = routePathToOutputPath(distDir, entry.path);
  const routeHtml = applyPageMetaToHtml(templateHtml, entry, siteUrl);

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, routeHtml, "utf8");
}

const notFoundHtml = applyPageMetaToHtml(templateHtml, buildNotFoundMeta(), siteUrl);
await fs.writeFile(path.resolve(distDir, "404.html"), notFoundHtml, "utf8");

process.stdout.write(
  `[routes] Wrote ${routeMetaEntries.length} route HTML files and dist/404.html\n`
);
