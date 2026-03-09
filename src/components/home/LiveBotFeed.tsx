import { useCallback, useEffect, useRef, useState } from "react";
import { getConfigValue } from "../../lib/runtimeConfig";

const BOT_WS_URL =
  getConfigValue("VITE_BOT_WS_URL") ??
  "wss://web-production-a6a95.up.railway.app/live-updates";

const BOT_URL =
  getConfigValue("VITE_BOT_URL") ??
  "https://web-production-a6a95.up.railway.app";

type ConnectionStatus = "connecting" | "live" | "reconnecting" | "offline";

type BotSnapshot = {
  uptime: number;
  heapUsed: number;
  heapTotal: number;
  totalCommands: number;
  errorRate: number;
  cacheHitRate: number;
  discordPing: number;
  hourlyActivity: number[];
  lastUpdated: number;
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

function parseUptimeSeconds(value: unknown): number {
  const direct = toNumber(value);
  if (direct !== null) {
    return Math.max(0, direct);
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const msValue = toNumber(record.ms);
    if (msValue !== null) {
      return Math.max(0, msValue / 1000);
    }

    const secondsValue = toNumber(record.seconds ?? record.sec ?? record.uptimeSeconds);
    if (secondsValue !== null) {
      return Math.max(0, secondsValue);
    }
  }

  return 0;
}

function normalizeHeapBytes(value: unknown): number {
  const raw = toNumber(value);
  if (raw === null || raw <= 0) {
    return 0;
  }

  // Some payloads report heap in MB, others in bytes.
  if (raw < 16384) {
    return raw * 1024 * 1024;
  }

  return raw;
}

function normalizePercent(value: unknown): number {
  const raw = toNumber(value);
  if (raw === null || raw < 0) {
    return 0;
  }

  const scaled = raw <= 1 ? raw * 100 : raw;
  return Math.round(scaled * 10) / 10;
}

function formatUptime(seconds: number): string {
  if (!seconds || seconds <= 0) return "—";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function toMB(bytes: number): number {
  return Math.round(bytes / 1024 / 1024);
}

function ActivitySparkline({ data }: Readonly<{ data: number[] }>) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const bars = data.length;
  const W = 300;
  const H = 40;
  const gap = 1.5;
  const barW = (W - gap * (bars - 1)) / bars;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="activity-sparkline"
      aria-label="24-hour command activity"
      preserveAspectRatio="none"
    >
      {data.map((val, i) => {
        const barH = Math.max(2, (val / max) * H);
        const hour = i;
        return (
          <rect
            key={hour}
            x={i * (barW + gap)}
            y={H - barH}
            width={barW}
            height={barH}
            className={val === max ? "spark-bar peak" : "spark-bar"}
          />
        );
      })}
    </svg>
  );
}

function statusLabel(status: ConnectionStatus): string {
  if (status === "live") return "LIVE";
  if (status === "connecting") return "CONNECTING";
  if (status === "reconnecting") return "RECONNECTING";
  return "OFFLINE";
}

export function LiveBotFeed() {
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [snapshot, setSnapshot] = useState<BotSnapshot | null>(null);
  const [secondsAgo, setSecondsAgo] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const offlineTimerRef = useRef<number | null>(null);
  const attemptsRef = useRef(0);
  const snapshotRef = useRef<BotSnapshot | null>(null);
  const isMountedRef = useRef(true);
  const intentionalCloseRef = useRef(false);

  const connect = useCallback(() => {
    if (!isMountedRef.current) {
      return;
    }

    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    intentionalCloseRef.current = false;
    setStatus(attemptsRef.current > 0 ? "reconnecting" : "connecting");

    const ws = new WebSocket(BOT_WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      attemptsRef.current = 0;
      if (offlineTimerRef.current) {
        clearTimeout(offlineTimerRef.current);
        offlineTimerRef.current = null;
      }
    };

    ws.onmessage = (event) => {
      if (!isMountedRef.current) {
        return;
      }

      try {
        const msg = JSON.parse(event.data as string) as {
          type: string;
          data?: Record<string, unknown>;
        };
        if (msg.type !== "dashboard_update" || !msg.data) return;

        const d = msg.data;
        const overview = (d.overview ?? {}) as Record<string, unknown>;
        const perf = (d.performance ?? {}) as Record<string, unknown>;
        const mem = (perf.memory ?? {}) as Record<string, unknown>;
        const cache = (perf.cache ?? {}) as Record<string, unknown>;
        const activity = (d.activity ?? {}) as Record<string, unknown>;
        const discord = (d.discord ?? {}) as Record<string, unknown>;
        let hourlyRaw: unknown[] = [];
        if (Array.isArray(activity.hourly)) {
          hourlyRaw = activity.hourly;
        } else if (Array.isArray(activity.hourlyActivity)) {
          hourlyRaw = activity.hourlyActivity;
        }

        const cmdSum = Array.isArray(activity.commands)
          ? (activity.commands as Record<string, unknown>[]).reduce(
              (sum, c) => sum + (toNumber(c.count) ?? 0),
              0
            )
          : 0;

        const next: BotSnapshot = {
          uptime: parseUptimeSeconds(overview.uptime ?? d.uptime),
          heapUsed: normalizeHeapBytes(mem.heapUsed ?? mem.used ?? mem.usedMB),
          heapTotal: normalizeHeapBytes(mem.heapTotal ?? mem.total ?? mem.totalMB),
          totalCommands: toNumber(overview.totalCommands ?? overview.totalInteractions) || cmdSum,
          errorRate: normalizePercent(overview.errorRate),
          cacheHitRate: normalizePercent(cache.hitRate ?? cache.hitRatio),
          discordPing: toNumber(discord.ping ?? discord.latency) ?? 0,
          hourlyActivity: hourlyRaw.map((value) => toNumber(value) ?? 0),
          lastUpdated: Date.now(),
        };

        snapshotRef.current = next;
        if (offlineTimerRef.current) {
          clearTimeout(offlineTimerRef.current);
          offlineTimerRef.current = null;
        }
        setSnapshot(next);
        setStatus("live");
        setSecondsAgo(0);
      } catch {
        // ignore malformed messages
      }
    };

    ws.onclose = () => {
      if (wsRef.current === ws) {
        wsRef.current = null;
      }

      if (!isMountedRef.current || intentionalCloseRef.current) {
        return;
      }

      setStatus("reconnecting");
      const delay = Math.min(1000 * Math.pow(2, attemptsRef.current), 30000);
      attemptsRef.current++;
      reconnectTimerRef.current = globalThis.setTimeout(connect, delay);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, []);

  // Poll /health immediately on mount — gives users something to see while WS connects
  useEffect(() => {
    isMountedRef.current = true;
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch(`${BOT_URL}/health`);
        if (!res.ok) throw new Error("unhealthy");
        const data = (await res.json()) as Record<string, unknown>;
        const memory = (data.memory ?? {}) as Record<string, unknown>;
        if (cancelled) return;

        const fallback: BotSnapshot = {
          uptime: parseUptimeSeconds(data.uptime ?? data.uptimeSeconds),
          heapUsed: normalizeHeapBytes(memory.heapUsed),
          heapTotal: normalizeHeapBytes(memory.heapTotal),
          totalCommands: 0,
          errorRate: 0,
          cacheHitRate: 0,
          discordPing: 0,
          hourlyActivity: [],
          lastUpdated: Date.now(),
        };

        // Only apply if WS hasn't already delivered richer data
        if (!snapshotRef.current) {
          snapshotRef.current = fallback;
          setSnapshot(fallback);
          setStatus("live");
        }
      } catch {
        // Health endpoint unreachable — let WS timeout handle offline state
        if (!cancelled && !snapshotRef.current) {
          if (offlineTimerRef.current) {
            clearTimeout(offlineTimerRef.current);
          }
          offlineTimerRef.current = globalThis.setTimeout(() => {
            if (!cancelled && !snapshotRef.current) setStatus("offline");
          }, 20000);
        }
      }
    };

    void poll();
    return () => {
      cancelled = true;
      if (offlineTimerRef.current) {
        clearTimeout(offlineTimerRef.current);
        offlineTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      isMountedRef.current = false;
      intentionalCloseRef.current = true;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (offlineTimerRef.current) {
        clearTimeout(offlineTimerRef.current);
        offlineTimerRef.current = null;
      }
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [connect]);

  // Tick "updated Xs ago"
  useEffect(() => {
    if (!snapshot) return;
    const ticker = globalThis.setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - snapshot.lastUpdated) / 1000));
    }, 1000);
    return () => clearInterval(ticker);
  }, [snapshot?.lastUpdated]);

  const memUsed = snapshot ? toMB(snapshot.heapUsed) : 0;
  const memTotal = snapshot ? toMB(snapshot.heapTotal) : 0;

  return (
    <section className="surface live-bot-feed">
      <div className="split-header">
        <div>
          <p className="eyebrow">Production Runtime</p>
          <h2>The bot, right now.</h2>
          <p>Direct read from the running system on Railway. No simulation.</p>
        </div>
        <div className="live-status-badge">
          <span className={`live-dot ${status}`} aria-hidden="true" />
          <span className="live-label">
            {statusLabel(status)}
          </span>
          {snapshot && status === "live" && (
            <span className="live-age">{secondsAgo}s ago</span>
          )}
        </div>
      </div>

      {snapshot ? (
        <>
          <div className="live-metrics-grid">
            <article className="card live-metric-card">
              <p className="tag">uptime</p>
              <h3>{formatUptime(snapshot.uptime)}</h3>
            </article>
            <article className="card live-metric-card">
              <p className="tag">heap</p>
              <h3>
                {memUsed}
                <span className="muted"> / {memTotal} MB</span>
              </h3>
            </article>
            {snapshot.totalCommands > 0 && (
              <article className="card live-metric-card">
                <p className="tag">commands run</p>
                <h3>{snapshot.totalCommands.toLocaleString()}</h3>
              </article>
            )}
            {snapshot.cacheHitRate > 0 && (
              <article className="card live-metric-card">
                <p className="tag">cache hit rate</p>
                <h3>{snapshot.cacheHitRate}%</h3>
              </article>
            )}
            {snapshot.errorRate > 0 && (
              <article className="card live-metric-card">
                <p className="tag">error rate</p>
                <h3>{snapshot.errorRate}%</h3>
              </article>
            )}
            {snapshot.discordPing > 0 && (
              <article className="card live-metric-card">
                <p className="tag">discord ping</p>
                <h3>{snapshot.discordPing}ms</h3>
              </article>
            )}
          </div>

          {snapshot.hourlyActivity.length > 0 && (
            <article className="card live-activity-card">
              <h3>Activity — last 24 hours</h3>
              <p className="muted">
                Command volume by hour. The shape tells you when this system matters.
              </p>
              <ActivitySparkline data={snapshot.hourlyActivity} />
            </article>
          )}
        </>
      ) : (
        <p className="muted live-connecting-msg">
          {status === "offline"
            ? "Bot is currently offline or unreachable."
            : "Connecting to production runtime…"}
        </p>
      )}
    </section>
  );
}
