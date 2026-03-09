import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getConfigValue } from "./runtimeConfig";

type PlausibleFn = ((event: string, options?: { u?: string }) => void) & {
  q?: unknown[][];
};

declare global {
  interface Window {
    plausible?: PlausibleFn;
  }
}

function ensurePlausibleLoaded(): boolean {
  const plausibleDomain = getConfigValue("VITE_PLAUSIBLE_DOMAIN");
  const plausibleScriptSrc = getConfigValue("VITE_PLAUSIBLE_SRC") || "https://plausible.io/js/script.js";

  if (!plausibleDomain) {
    return false;
  }

  if (document.querySelector("script[data-cs-plausible='true']")) {
    return true;
  }

  if (!window.plausible) {
    const queueFn = ((...args: unknown[]) => {
      queueFn.q = queueFn.q || [];
      queueFn.q.push(args);
    }) as PlausibleFn;
    window.plausible = queueFn;
  }

  const script = document.createElement("script");
  script.defer = true;
  script.src = plausibleScriptSrc;
  script.setAttribute("data-domain", plausibleDomain);
  script.setAttribute("data-manual", "true");
  script.setAttribute("data-cs-plausible", "true");
  document.head.appendChild(script);
  return true;
}

export function usePlausiblePageviews() {
  const location = useLocation();

  useEffect(() => {
    const enabled = ensurePlausibleLoaded();
    if (!enabled || !window.plausible) {
      return;
    }
    const route = `${location.pathname}${location.search}${location.hash}`;
    window.plausible("pageview", { u: route });
  }, [location.pathname, location.search, location.hash]);
}
