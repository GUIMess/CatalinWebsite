import { describe, expect, it } from "vitest";
import workItems from "../src/content/work.json";
import { buildSitemapPaths, buildSitemapXml } from "../scripts/sitemap-utils.mjs";

describe("sitemap generation", () => {
  it("includes live static routes and all work slugs", () => {
    const paths = buildSitemapPaths(workItems);

    expect(paths).toContain("/");
    expect(paths).toContain("/work");
    expect(paths).toContain("/playground");
    expect(paths).toContain("/lab-log");
    expect(paths).toContain("/contact");

    for (const item of workItems) {
      expect(paths).toContain(`/work/${item.slug}`);
    }

    expect(paths).not.toContain("/gifts");
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("renders canonical XML entries for each path", () => {
    const xml = buildSitemapXml("https://example.com/", ["/", "/work", "/work/live-alert-bot-core"]);

    expect(xml).toContain("<loc>https://example.com/</loc>");
    expect(xml).toContain("<loc>https://example.com/work</loc>");
    expect(xml).toContain("<loc>https://example.com/work/live-alert-bot-core</loc>");
  });
});
