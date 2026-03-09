type RuntimeConfigKey =
  | "VITE_SITE_URL"
  | "VITE_PLAUSIBLE_DOMAIN"
  | "VITE_PLAUSIBLE_SRC"
  | "VITE_FORMSPREE_ENDPOINT"
  | "VITE_BOT_URL"
  | "VITE_BOT_WS_URL";

type RuntimeConfig = Partial<Record<RuntimeConfigKey, string>>;

declare global {
  interface Window {
    __APP_CONFIG__?: RuntimeConfig;
  }
}

function cleanValue(value?: string): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

export function getConfigValue(key: RuntimeConfigKey): string | undefined {
  const runtimeValue = typeof window !== "undefined" ? cleanValue(window.__APP_CONFIG__?.[key]) : undefined;
  if (runtimeValue) {
    return runtimeValue;
  }

  return cleanValue(import.meta.env[key]);
}
