import path from "node:path";
import { describe, expect, it } from "vitest";
import workItems from "../src/content/work.json";
import {
  applyPageMetaToHtml,
  buildRouteMetaEntries,
  routePathToOutputPath
} from "../scripts/route-html-utils.mjs";

const templateHtml = `<!doctype html>
<html lang="en">
  <head>
    <title>Default title</title>
    <meta name="description" content="Default description" />
    <meta name="robots" content="index,follow" />
    <meta property="og:title" content="Default title" />
    <meta property="og:description" content="Default description" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://example.com/" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="Default title" />
    <meta name="twitter:description" content="Default description" />
    <link rel="canonical" href="https://example.com/" />
  </head>
  <body></body>
</html>`;

describe("route HTML generation", () => {
  it("builds metadata for static pages and work detail routes", () => {
    const routes = buildRouteMetaEntries(workItems);

    expect(routes.find((route) => route.path === "/playground")?.title).toBe("Playground | Catalin Siegling");
    expect(routes.find((route) => route.path === "/work/live-alert-bot-core")?.title).toBe(
      "Production Sports Bot | Catalin Siegling"
    );
  });

  it("injects route-specific metadata into the HTML shell", () => {
    const html = applyPageMetaToHtml(
      templateHtml,
      {
        path: "/work/live-alert-bot-core",
        title: "Production Sports Bot | Catalin Siegling",
        description: "A live work page."
      },
      "https://portfolio.example.com/"
    );

    expect(html).toContain("<title>Production Sports Bot | Catalin Siegling</title>");
    expect(html).toContain('content="https://portfolio.example.com/work/live-alert-bot-core"');
    expect(html).toContain('content="A live work page."');
  });

  it("writes nested routes to directory index files", () => {
    const outputPath = routePathToOutputPath("C:\\site\\dist", "/work/live-alert-bot-core");
    expect(outputPath.endsWith(path.join("work", "live-alert-bot-core", "index.html"))).toBe(true);
  });
});
