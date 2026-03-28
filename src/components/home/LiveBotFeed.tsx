import { useEffect, useRef, useState } from "react";
import { getConfigValue } from "../../lib/runtimeConfig";

const BOT_URL =
  getConfigValue("VITE_BOT_URL") ??
  "https://web-production-a6a95.up.railway.app";

const BOT_TELEMETRY_URL = `${BOT_URL.replace(/\/$/, "")}/api/public/portfolio-telemetry`;
const FALLBACK_TELEMETRY_URL = "/portfolio-telemetry-fallback.json";
const TELEMETRY_CACHE_KEY = "portfolio-telemetry-snapshot-v1";
const pollIntervalMs = 30000;

const integerFormatter = new Intl.NumberFormat("en-US");
const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

type FeedStatus = "loading" | "live" | "degraded" | "stale" | "offline";

type FeatureMixItem = {
  key: string;
  label: string;
  count: number;
  share: number;
};

type TelemetrySnapshot = {
  status: "live" | "degraded";
  dataMode: "full" | "limited";
  generatedAt: number;
  commands24h: number | null;
  commands30d: number | null;
  commandsAllTime: number | null;
  newsPosts24h: number | null;
  newsPosts30d: number | null;
  activity24h: number[];
  activity30d: number[];
  avgResponseMs24h: number | null;
  avgResponseMs30d: number | null;
  avgResponseMsSinceRestart: number | null;
  errorRate24h: number | null;
  errorRate30d: number | null;
  errorRateSinceRestart: number | null;
  cacheHitRate: number | null;
  discordPingMs: number | null;
  lastActiveAt: number | null;
  featureMix24h: FeatureMixItem[];
  featureMix30d: FeatureMixItem[];
};

type TelemetryEnvelope = {
  success?: boolean;
  data?: unknown;
};

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function normalizePercent(value: unknown): number | null {
  const numeric = toNumber(value);
  if (numeric === null || numeric < 0) {
    return null;
  }

  const scaled = numeric <= 1 ? numeric * 100 : numeric;
  return Math.round(scaled * 10) / 10;
}

function normalizeSeries(values: unknown, length: number): number[] {
  if (!Array.isArray(values)) {
    return new Array(length).fill(0);
  }

  const next = values.slice(0, length).map((value) => Math.max(0, toNumber(value) ?? 0));
  while (next.length < length) {
    next.push(0);
  }
  return next;
}

function readTelemetryData(payload: unknown): unknown {
  if (!payload || typeof payload !== "object") {
    return payload;
  }

  const data = payload as Record<string, unknown>;
  return "data" in data ? data.data : payload;
}

function parseTelemetry(payload: unknown): TelemetrySnapshot | null {
  const payloadData = readTelemetryData(payload);
  if (!payloadData || typeof payloadData !== "object") {
    return null;
  }

  const data = payloadData as Record<string, unknown>;
  const generatedAt = Date.parse(String(data.generatedAt ?? ""));
  const featureMixRaw = Array.isArray(data.featureMix24h) ? data.featureMix24h : [];

  return {
    status: data.status === "degraded" ? "degraded" : "live",
    dataMode: data.dataMode === "limited" ? "limited" : "full",
    generatedAt: Number.isFinite(generatedAt) ? generatedAt : Date.now(),
    commands24h: toNumber(data.commands24h),
    commands30d: toNumber(data.commands30d),
    commandsAllTime: toNumber(data.commandsAllTime),
    newsPosts24h: toNumber(data.newsPosts24h),
    newsPosts30d: toNumber(data.newsPosts30d),
    activity24h: normalizeSeries(data.activity24h, 24),
    activity30d: normalizeSeries(data.activity30d, 30),
    avgResponseMs24h: toNumber(data.avgResponseMs24h),
    avgResponseMs30d: toNumber(data.avgResponseMs30d),
    avgResponseMsSinceRestart: toNumber(data.avgResponseMsSinceRestart),
    errorRate24h: normalizePercent(data.errorRate24h),
    errorRate30d: normalizePercent(data.errorRate30d),
    errorRateSinceRestart: normalizePercent(data.errorRateSinceRestart),
    cacheHitRate: normalizePercent(data.cacheHitRate),
    discordPingMs: toNumber(data.discordPingMs),
    lastActiveAt: Number.isFinite(Date.parse(String(data.lastActiveAt ?? "")))
      ? Date.parse(String(data.lastActiveAt))
      : null,
    featureMix24h: featureMixRaw
      .map((item) => {
        if (!item || typeof item !== "object") {
          return null;
        }

        const record = item as Record<string, unknown>;
        const key = typeof record.key === "string" ? record.key : "";
        const label = typeof record.label === "string" ? record.label : "";
        const count = Math.max(0, toNumber(record.count) ?? 0);
        const share = Math.max(0, normalizePercent(record.share) ?? 0);

        if (!key || !label || count <= 0) {
          return null;
        }

        return { key, label, count, share };
      })
      .filter((item): item is FeatureMixItem => item !== null),
    featureMix30d: (Array.isArray(data.featureMix30d) ? data.featureMix30d : [])
      .map((item) => {
        if (!item || typeof item !== "object") {
          return null;
        }

        const record = item as Record<string, unknown>;
        const key = typeof record.key === "string" ? record.key : "";
        const label = typeof record.label === "string" ? record.label : "";
        const count = Math.max(0, toNumber(record.count) ?? 0);
        const share = Math.max(0, normalizePercent(record.share) ?? 0);

        if (!key || !label || count <= 0) {
          return null;
        }

        return { key, label, count, share };
      })
      .filter((item): item is FeatureMixItem => item !== null),
  };
}

function formatInteger(value: number | null): string {
  if (value === null) return "n/a";
  return integerFormatter.format(Math.round(value));
}

function formatCompact(value: number | null): string {
  if (value === null) return "n/a";
  return compactFormatter.format(value);
}

function formatPercent(value: number | null): string {
  if (value === null) return "n/a";
  return `${value.toFixed(value >= 10 ? 0 : 1)}%`;
}

function formatMilliseconds(value: number | null, maxReasonable = 60000): string {
  if (value === null || value <= 0) return "n/a";
  if (value > maxReasonable) return "n/a";
  return `${Math.round(value)}ms`;
}

function formatSecondsAgo(value: number): string {
  if (value < 60) return `${value}s ago`;
  const minutes = Math.floor(value / 60);
  return `${minutes}m ago`;
}

function formatTimeAgo(timestamp: number | null): string | null {
  if (timestamp === null) return null;

  const diffSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
  return `${Math.floor(diffSeconds / 86400)}d ago`;
}

function hasSignal(values: number[]): boolean {
  return values.some((value) => value > 0);
}

function activitySummary(
  activity: number[],
  unit: "hour" | "day",
  noun: { singular: string; plural: string },
): string {
  if (!activity.length) {
    return "No recent activity shape available.";
  }

  const peak = Math.max(...activity, 0);
  const activeHours = activity.filter((value) => value > 0).length;

  if (peak <= 0) {
    return "Quiet window in the last 24 hours.";
  }

  const label = unit === "day" ? "day" : "hour";
  const labelPlural = activeHours === 1 ? label : `${label}s`;
  const nounLabel = peak === 1 ? noun.singular : noun.plural;
  return `${formatInteger(peak)} ${nounLabel} at the busiest ${label} across ${activeHours} active ${labelPlural}.`;
}

function readCachedSnapshot(): TelemetrySnapshot | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(TELEMETRY_CACHE_KEY);
    if (!raw) {
      return null;
    }

    return parseTelemetry(JSON.parse(raw));
  } catch {
    return null;
  }
}

function writeCachedSnapshot(payload: unknown) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(TELEMETRY_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage failures; telemetry should still render live.
  }
}

async function loadBundledFallbackSnapshot(): Promise<TelemetrySnapshot | null> {
  try {
    const response = await fetch(FALLBACK_TELEMETRY_URL, { cache: "no-store" });
    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as TelemetryEnvelope;
    return parseTelemetry(payload);
  } catch {
    return null;
  }
}

async function resolveFallbackSnapshot(currentSnapshot: TelemetrySnapshot | null): Promise<TelemetrySnapshot | null> {
  if (currentSnapshot) {
    return currentSnapshot;
  }

  return readCachedSnapshot() ?? loadBundledFallbackSnapshot();
}

function ActivityBands({ data, label }: Readonly<{ data: number[]; label: string }>) {
  if (!data.length || !hasSignal(data)) {
    return null;
  }

  const max = Math.max(...data, 1);
  const width = data.length > 24 ? 520 : 420;
  const height = 148;
  const gap = data.length > 24 ? 4 : 6;
  const barWidth = (width - gap * (data.length - 1)) / data.length;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="telemetry-activity-chart"
      role="img"
      aria-label={label}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="telemetryBars" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#b7ddd6" />
          <stop offset="100%" stopColor="#5a8c85" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((step) => (
        <line
          key={step}
          x1="0"
          x2={width}
          y1={height - height * step}
          y2={height - height * step}
          className="telemetry-grid-line"
        />
      ))}
      {data.map((value, index) => {
        const barHeight = value <= 0 ? 0 : Math.max(6, (value / max) * (height - 6));
        const isPeak = value === max && max > 0;

        return (
          <rect
            key={`${index}-${value}`}
            x={index * (barWidth + gap)}
            y={height - barHeight}
            width={barWidth}
            height={barHeight}
            rx="8"
            className={isPeak ? "telemetry-activity-bar peak" : "telemetry-activity-bar"}
          />
        );
      })}
    </svg>
  );
}

function statusLabel(status: FeedStatus): string {
  if (status === "live") return "Live";
  if (status === "degraded") return "Degraded";
  if (status === "stale") return "Stale";
  if (status === "offline") return "Offline";
  return "Syncing";
}

export function LiveBotFeed() {
  const [feedStatus, setFeedStatus] = useState<FeedStatus>("loading");
  const [snapshot, setSnapshot] = useState<TelemetrySnapshot | null>(null);
  const [secondsAgo, setSecondsAgo] = useState(0);
  const snapshotRef = useRef<TelemetrySnapshot | null>(null);

  useEffect(() => {
    let cancelled = false;

    const sync = async () => {
      try {
        const response = await fetch(BOT_TELEMETRY_URL, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Telemetry request failed with ${response.status}`);
        }

        const payload = (await response.json()) as TelemetryEnvelope;
        const nextSnapshot = parseTelemetry(payload);

        if (!nextSnapshot) {
          throw new Error("Telemetry payload was missing data");
        }

        if (cancelled) {
          return;
        }

        snapshotRef.current = nextSnapshot;
        setSnapshot(nextSnapshot);
        setFeedStatus(nextSnapshot.status === "degraded" ? "degraded" : "live");
        setSecondsAgo(Math.floor((Date.now() - nextSnapshot.generatedAt) / 1000));
        writeCachedSnapshot(readTelemetryData(payload));
      } catch {
        if (cancelled) {
          return;
        }

        const fallbackSnapshot = await resolveFallbackSnapshot(snapshotRef.current);
        if (cancelled) {
          return;
        }

        if (fallbackSnapshot) {
          snapshotRef.current = fallbackSnapshot;
          setSnapshot(fallbackSnapshot);
          setFeedStatus("stale");
          setSecondsAgo(Math.floor((Date.now() - fallbackSnapshot.generatedAt) / 1000));
          return;
        }

        setFeedStatus("offline");
      }
    };

    void sync();
    const poller = globalThis.setInterval(() => {
      void sync();
    }, pollIntervalMs);

    return () => {
      cancelled = true;
      clearInterval(poller);
    };
  }, []);

  useEffect(() => {
    if (!snapshot) {
      return;
    }

    const ticker = globalThis.setInterval(() => {
      setSecondsAgo(Math.max(0, Math.floor((Date.now() - snapshot.generatedAt) / 1000)));
    }, 1000);

    return () => clearInterval(ticker);
  }, [snapshot?.generatedAt]);

  const hasRollingCommands = (snapshot?.commands30d ?? 0) > 0;
  const hasRollingNews = (snapshot?.newsPosts30d ?? 0) > 0;
  const has24hResponse =
    (snapshot?.avgResponseMs24h ?? 0) > 0 || snapshot?.errorRate24h !== null;
  const hasRollingResponse =
    (snapshot?.avgResponseMs30d ?? 0) > 0 || snapshot?.errorRate30d !== null;
  const hasRuntimeResponse =
    (snapshot?.avgResponseMsSinceRestart ?? 0) > 0 ||
    snapshot?.errorRateSinceRestart !== null;
  const commandsWindowHours =
    snapshot && (snapshot.commands24h ?? 0) > 0 ? 24 : hasRollingCommands ? 30 * 24 : 24;
  const newsWindowHours =
    snapshot && (snapshot.newsPosts24h ?? 0) > 0 ? 24 : hasRollingNews ? 30 * 24 : 24;
  const featureMix =
    snapshot?.featureMix24h?.length ? snapshot.featureMix24h : snapshot?.featureMix30d ?? [];
  const featureMixWindowHours = snapshot?.featureMix24h?.length ? 24 : 30 * 24;
  const activity24h = snapshot?.activity24h ?? [];
  const activity30d = snapshot?.activity30d ?? [];
  const activityUses24h = hasSignal(activity24h);
  const activityUses30d = !activityUses24h && hasSignal(activity30d);
  const activity = activityUses24h ? activity24h : activityUses30d ? activity30d : [];
  const activityRangeLabel = activityUses24h ? "24h activity shape" : "30d activity shape";
  const activityStartLabel = activityUses24h ? "24h ago" : "30d ago";
  const activityEndLabel = activityUses24h ? "now" : "today";
  const activityHeading = activityUses24h ? "Activity rhythm" : "Activity cadence";
  const lastActiveLabel = formatTimeAgo(snapshot?.lastActiveAt ?? null);
  const featureMixTotal = featureMix.reduce((sum, feature) => sum + feature.count, 0);
  const commandsValue =
    commandsWindowHours === 24 ? snapshot?.commands24h ?? null : snapshot?.commands30d ?? snapshot?.commands24h ?? null;
  const newsPostsValue =
    newsWindowHours === 24 ? snapshot?.newsPosts24h ?? null : snapshot?.newsPosts30d ?? snapshot?.newsPosts24h ?? null;
  const useTrackedUsageFallback =
    (commandsValue ?? 0) <= 0 && featureMixTotal > 0;
  const primaryUsageLabel = useTrackedUsageFallback
    ? `tracked uses / ${featureMixWindowHours === 24 ? "24h" : "30d"}`
    : `commands / ${commandsWindowHours === 24 ? "24h" : "30d"}`;
  const primaryUsageValue = useTrackedUsageFallback ? featureMixTotal : commandsValue;
  const activityNoun = useTrackedUsageFallback
    ? { singular: "tracked interaction", plural: "tracked interactions" }
    : { singular: "command", plural: "commands" };
  const peakSummary = activitySummary(
    activity,
    activityUses24h ? "hour" : "day",
    activityNoun,
  );
  const activityChartLabel = `${activityHeading} for the last ${activityUses24h ? "24 hours" : "30 days"}. ${peakSummary}`;
  const responseWindowLabel = has24hResponse
    ? "24h"
    : hasRollingResponse
      ? "30d"
      : hasRuntimeResponse
        ? "since restart"
        : "24h";
  const avgResponseValue = has24hResponse
    ? snapshot?.avgResponseMs24h ?? null
    : hasRollingResponse
      ? snapshot?.avgResponseMs30d ?? snapshot?.avgResponseMs24h ?? null
      : hasRuntimeResponse
        ? snapshot?.avgResponseMsSinceRestart ?? null
        : null;
  const errorRateValue = has24hResponse
    ? snapshot?.errorRate24h ?? null
    : hasRollingResponse
      ? snapshot?.errorRate30d ?? snapshot?.errorRate24h ?? null
      : hasRuntimeResponse
        ? snapshot?.errorRateSinceRestart ?? null
        : null;
  const runtimeHealthLabel =
    responseWindowLabel === "since restart"
      ? "Live runtime counters"
      : responseWindowLabel === "30d"
        ? "Rolling 30-day response context"
        : "Live surface checks";
  const telemetryWindowLabel =
    feedStatus === "stale"
      ? "Cached telemetry fallback"
      : snapshot?.dataMode === "limited"
        ? "Runtime signal only"
        : activityUses24h
          ? "24-hour production window"
          : "30-day rolling command window";

  return (
    <section className="surface portfolio-telemetry" id="live-proof">
      <div className="chapter-header telemetry-header">
        <div className="chapter-index-block">
          <span>01</span>
          <small>Live proof</small>
        </div>
        <div>
          <p className="eyebrow">Live Telemetry</p>
          <h2>Live telemetry from the production bot.</h2>
        </div>
        <div className={`telemetry-status telemetry-status-${feedStatus}`}>
          <span className="telemetry-status-dot" aria-hidden="true" />
          <span>{statusLabel(feedStatus)}</span>
          {snapshot ? <span className="telemetry-status-age">{formatSecondsAgo(secondsAgo)}</span> : null}
        </div>
      </div>

      {snapshot ? (
        <div className="telemetry-shell">
          <div className="telemetry-stage">
            <div className="telemetry-stage-topline">
              <span>{telemetryWindowLabel}</span>
              <span>{activity.length ? peakSummary : lastActiveLabel ? `Last tracked ${lastActiveLabel}` : "Quiet window"}</span>
            </div>

            <div className="telemetry-statline" aria-label="Telemetry summary">
              <article className="telemetry-stat telemetry-stat-primary">
                <span>{primaryUsageLabel}</span>
                <strong>{formatInteger(primaryUsageValue)}</strong>
              </article>
              <article className="telemetry-stat">
                <span>all-time handled</span>
                <strong>{formatCompact(snapshot.commandsAllTime)}</strong>
              </article>
              <article className="telemetry-stat">
                <span>{`news posts / ${newsWindowHours === 24 ? "24h" : "30d"}`}</span>
                <strong>{formatInteger(newsPostsValue)}</strong>
              </article>
            </div>

            <div className="telemetry-chart-card">
              <div className="telemetry-chart-head">
                <h3>{activityHeading}</h3>
                <span>{activityRangeLabel}</span>
              </div>
              {activity.length ? (
                <>
                  <ActivityBands data={activity} label={activityChartLabel} />
                  <div className="telemetry-chart-scale" aria-hidden="true">
                    <span>{activityStartLabel}</span>
                    <span>{activityEndLabel}</span>
                  </div>
                </>
              ) : (
                <p className="muted telemetry-empty-state">Tracked command activity is quiet right now.</p>
              )}
            </div>
          </div>

          <div className="telemetry-side">
            <article className="telemetry-panel telemetry-health-panel">
              <div className="telemetry-panel-head">
                <h3>Runtime health</h3>
                <span>{runtimeHealthLabel}</span>
              </div>
              <div className="telemetry-health-grid">
                <div className="telemetry-health-item">
                  <span>{`avg response / ${responseWindowLabel}`}</span>
                  <strong>{formatMilliseconds(avgResponseValue)}</strong>
                </div>
                <div className="telemetry-health-item">
                  <span>cache hit</span>
                  <strong>{formatPercent(snapshot.cacheHitRate)}</strong>
                </div>
                <div className="telemetry-health-item">
                  <span>{`error rate / ${responseWindowLabel}`}</span>
                  <strong>{formatPercent(errorRateValue)}</strong>
                </div>
                <div className="telemetry-health-item">
                  <span>discord ping</span>
                  <strong>{formatMilliseconds(snapshot.discordPingMs)}</strong>
                </div>
              </div>
            </article>

            <article className="telemetry-panel telemetry-feature-panel">
              <div className="telemetry-panel-head">
                <h3>Feature mix</h3>
                <span>
                  {featureMixWindowHours === 24 ? "What people are actually using" : "Rolling 30-day usage mix"}
                </span>
              </div>
              {featureMix.length ? (
                <div className="telemetry-feature-list">
                  {featureMix.map((feature) => (
                    <div className="telemetry-feature-row" key={feature.key}>
                      <div className="telemetry-feature-copy">
                        <span>{feature.label}</span>
                        <strong>{formatPercent(feature.share)}</strong>
                      </div>
                      <div className="telemetry-feature-track" aria-hidden="true">
                        <div
                          className="telemetry-feature-fill"
                          style={{ width: `${Math.max(feature.share, 8)}%` }}
                        />
                      </div>
                      <small>{formatInteger(feature.count)} tracked interactions</small>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted telemetry-empty-state">Feature telemetry is quiet right now.</p>
              )}
            </article>
          </div>
        </div>
      ) : (
        <div className="telemetry-empty">
          <p className="muted">
            {feedStatus === "offline"
              ? "Live telemetry is unavailable right now."
              : "Syncing live telemetry from the bot."}
          </p>
        </div>
      )}
    </section>
  );
}
