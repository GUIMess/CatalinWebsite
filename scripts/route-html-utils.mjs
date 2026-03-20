import path from "node:path";

const defaultSiteUrl = "https://www.catalinsiegling.com";
const defaultRobots = "index,follow";

const staticPageMeta = [
  {
    path: "/",
    title: "Catalin Siegling | Live Systems and Product Work",
    description:
      "A live systems portfolio centered on production bot work, recent fixes, and product experiments."
  },
  {
    path: "/playground",
    title: "Playground | Catalin Siegling",
    description:
      "Smaller experiments used to test interaction feel, operational tradeoffs, and interface direction."
  },
  {
    path: "/work",
    title: "Work Systems | Catalin Siegling",
    description:
      "A focused set of shipped systems with tradeoffs, failure points, and what changed over time."
  },
  {
    path: "/lab-log",
    title: "Build Feed | Catalin Siegling",
    description: "Chronological build notes covering shipped work, mistakes, and iteration."
  },
  {
    path: "/contact",
    title: "Contact | Catalin Siegling",
    description: "Send project context, constraints, and timeline to start a focused product build."
  }
];

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function cleanBaseUrl(url) {
  return String(url || defaultSiteUrl).replace(/\/+$/, "");
}

export function normalizeRoutePath(routePath) {
  if (!routePath || routePath === "/") {
    return "/";
  }

  return `/${String(routePath).replace(/^\/+|\/+$/g, "")}`;
}

export function buildAbsoluteUrl(siteUrl, routePath) {
  const baseUrl = cleanBaseUrl(siteUrl || defaultSiteUrl);
  const normalizedPath = normalizeRoutePath(routePath);

  return normalizedPath === "/" ? `${baseUrl}/` : `${baseUrl}${normalizedPath}`;
}

function upsertMetaTag(html, selector, tag) {
  if (selector.test(html)) {
    return html.replace(selector, tag);
  }

  return html.replace("</head>", `  ${tag}\n  </head>`);
}

function upsertMetaByName(html, name, content) {
  const selector = new RegExp(`<meta\\s+[^>]*name=["']${escapeRegex(name)}["'][^>]*>`, "i");
  const tag = `<meta name="${name}" content="${escapeHtml(content)}" />`;
  return upsertMetaTag(html, selector, tag);
}

function upsertMetaByProperty(html, property, content) {
  const selector = new RegExp(`<meta\\s+[^>]*property=["']${escapeRegex(property)}["'][^>]*>`, "i");
  const tag = `<meta property="${property}" content="${escapeHtml(content)}" />`;
  return upsertMetaTag(html, selector, tag);
}

function upsertCanonical(html, href) {
  const selector = /<link\s+[^>]*rel=["']canonical["'][^>]*>/i;
  const tag = `<link rel="canonical" href="${escapeHtml(href)}" />`;
  return upsertMetaTag(html, selector, tag);
}

export function buildRouteMetaEntries(workItems) {
  const workRoutes = workItems.map((item) => ({
    path: `/work/${item.slug}`,
    title: `${item.title} | Catalin Siegling`,
    description:
      item.summary ?? "System view focused on tradeoffs, runtime states, and what changed under real use."
  }));

  return [...staticPageMeta, ...workRoutes];
}

export function applyPageMetaToHtml(html, pageMeta, siteUrl = defaultSiteUrl) {
  const routePath = normalizeRoutePath(pageMeta.path);
  const title = pageMeta.title;
  const description = pageMeta.description;
  const robots = pageMeta.robots ?? defaultRobots;
  const absoluteUrl = buildAbsoluteUrl(siteUrl, routePath);

  let nextHtml = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  nextHtml = upsertMetaByName(nextHtml, "description", description);
  nextHtml = upsertMetaByName(nextHtml, "robots", robots);
  nextHtml = upsertMetaByName(nextHtml, "twitter:card", "summary");
  nextHtml = upsertMetaByName(nextHtml, "twitter:title", title);
  nextHtml = upsertMetaByName(nextHtml, "twitter:description", description);
  nextHtml = upsertMetaByProperty(nextHtml, "og:type", "website");
  nextHtml = upsertMetaByProperty(nextHtml, "og:title", title);
  nextHtml = upsertMetaByProperty(nextHtml, "og:description", description);
  nextHtml = upsertMetaByProperty(nextHtml, "og:url", absoluteUrl);
  nextHtml = upsertCanonical(nextHtml, absoluteUrl);

  return nextHtml;
}

export function routePathToOutputPath(distDir, routePath) {
  const normalizedPath = normalizeRoutePath(routePath);
  if (normalizedPath === "/") {
    return path.resolve(distDir, "index.html");
  }

  return path.resolve(distDir, normalizedPath.slice(1), "index.html");
}

export function buildNotFoundMeta() {
  return {
    path: "/404",
    title: "Page Not Found | Catalin Siegling",
    description: "The page you requested is not active on this portfolio.",
    robots: "noindex,nofollow"
  };
}
