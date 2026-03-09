import { useEffect } from "react";
import { getConfigValue } from "./runtimeConfig";

type PageMetaOptions = {
  title: string;
  description: string;
  path: string;
  robots?: string;
};

const fallbackSiteUrl = "https://www.catalinsiegling.com";

function cleanBaseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

function upsertMetaByName(name: string, content: string) {
  let tag = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("name", name);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

function upsertMetaByProperty(property: string, content: string) {
  let tag = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("property", property);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

function upsertCanonical(url: string) {
  let link = document.querySelector<HTMLLinkElement>("link[rel='canonical']");
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", url);
}

export function usePageMeta({ title, description, path, robots = "index,follow" }: PageMetaOptions) {
  useEffect(() => {
    const baseUrl = cleanBaseUrl(getConfigValue("VITE_SITE_URL") || fallbackSiteUrl);
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const absoluteUrl = `${baseUrl}${normalizedPath}`;

    document.title = title;

    upsertMetaByName("description", description);
    upsertMetaByName("robots", robots);
    upsertMetaByName("twitter:card", "summary");
    upsertMetaByName("twitter:title", title);
    upsertMetaByName("twitter:description", description);

    upsertMetaByProperty("og:type", "website");
    upsertMetaByProperty("og:title", title);
    upsertMetaByProperty("og:description", description);
    upsertMetaByProperty("og:url", absoluteUrl);

    upsertCanonical(absoluteUrl);
  }, [title, description, path, robots]);
}
