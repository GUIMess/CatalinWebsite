export type BotTopologyStep = {
  title: string;
  summary: string;
  evidence: string[];
};

export type BotControlSurface = {
  title: string;
  summary: string;
  signal: string;
};

export type BotIncident = {
  id: string;
  title: string;
  symptom: string;
  cause: string;
  fix: string;
  outcome: string;
  receipts: string[];
};

export type BotLogTapeEntry = {
  channel: string;
  message: string;
  receipt: string;
};

export const botTopology: BotTopologyStep[] = [
  {
    title: "Bootstrap and isolate high-risk runtime work",
    summary:
      "Startup is split into bootstrap, initialization, and runtime phases so failures are locatable and heavy image dependencies are configured before they fragment the process.",
    evidence: ["bot.js", "utils/sharpConfig.js", "core/bot-schedulers.js"]
  },
  {
    title: "Ingest and normalize messy upstream sports data",
    summary:
      "Schedulers and services pull live data from multiple providers, normalize it into one internal shape, and route it into commands, alerts, and dashboard surfaces.",
    evidence: ["core/bot-schedulers.js", "services/apiService.js", "core/bot-events.js"]
  },
  {
    title: "Absorb traffic spikes with queues, caches, and fallbacks",
    summary:
      "The system relies on namespace-aware cache TTLs, request deduplication, and stale-cache fallbacks so provider or database issues degrade the bot instead of taking it fully offline.",
    evidence: ["utils/unifiedCache.js", "routes/dashboard.js", "services/redisCache.js"]
  },
  {
    title: "Expose operator visibility without exposing the community",
    summary:
      "Health routes, WebSocket updates, scheduler health, and analytics make the runtime inspectable while keeping guild identity, IDs, and moderation surfaces out of the portfolio.",
    evidence: ["core/bot-server.js", "routes/dashboard.js", "utils/schedulerHealth.js"]
  }
];

export const botControlSurfaces: BotControlSurface[] = [
  {
    title: "Health and live update surfaces",
    summary:
      "The bot publishes machine-readable health checks and WebSocket runtime updates, which is why this portfolio can show a live feed instead of a screenshot.",
    signal: "Receipts: /health, /status, /live-updates"
  },
  {
    title: "Scheduler heartbeat tracking",
    summary:
      "Each scheduler tracks interval metadata, heartbeat age, error count, and degraded or critical state instead of pretending that 'started once' means 'healthy now.'",
    signal: "Evidence snapshot currently sees 15 registered scheduler loops."
  },
  {
    title: "Two-layer cache and request dedupe",
    summary:
      "Hot reads hit memory first, Redis second, and duplicate in-flight fetches collapse behind a shared pending request so burst traffic does not stampede upstream APIs.",
    signal: "Receipts: unified cache namespaces, Redis promotion, pending request map"
  },
  {
    title: "Graceful shutdown discipline",
    summary:
      "Shutdown clears caches, analytics, Redis, Mongo, SVG workers, and interval-based services so restarts do not leave invisible work running in the background.",
    signal: "Receipt: bot.js cleanup touches API, cache, analytics, core, Mongo, and Redis"
  }
];

export const botIncidentLedger: BotIncident[] = [
  {
    id: "interaction-expiry",
    title: "Discord interactions were expiring under load",
    symptom: "Commands could die with 10062 before a response was ever visible.",
    cause: "The bot was still doing validation and permission work before acknowledging the interaction.",
    fix: "BaseCommand now defers immediately, swallows expired interactions quietly, and avoids double-defer noise.",
    outcome: "Slow command paths stay alive under load and expired interactions stop polluting logs.",
    receipts: ["core/BaseCommand.js", "Immediate defer before validation", "10062 handling"]
  },
  {
    id: "analytics-recovery",
    title: "Activity graphs could go flat after restarts",
    symptom: "The 24-hour view could look dead even while commands were still running.",
    cause: "All-zero Mongo buckets were winning over live memory data, and the hourly buffer could lose its circular shape after reset or hydrate paths.",
    fix: "Dashboard analytics now prefers non-zero rolling buckets and the collector self-heals the hourly activity buffer when snapshots are restored.",
    outcome: "Current-session activity survives warmup, hydrate, and restart paths instead of disappearing from the graph.",
    receipts: ["routes/dashboard.js", "utils/analyticsCollector.js", "5e45e46d", "5ef78cac"]
  },
  {
    id: "scheduler-stale-detection",
    title: "Schedulers could fail quietly",
    symptom: "A loop could stop firing long before users realized something was missing.",
    cause: "The visibility model was basically binary: started or not started.",
    fix: "Scheduler health now tracks heartbeat age, interval-derived stale thresholds, consecutive errors, and degraded or critical state.",
    outcome: "Silent failure becomes an operational state that can be surfaced and acted on early.",
    receipts: ["utils/schedulerHealth.js", "core/bot-schedulers.js", "ea430e9c"]
  },
  {
    id: "memory-isolation",
    title: "Memory fixes had to move beyond one-off patches",
    symptom: "Image rendering and native memory behavior kept forcing emergency thinking during deploys and high-output windows.",
    cause: "Global Sharp config, render process layout, and deploy-time memory assumptions were all interacting.",
    fix: "Sharp is configured before any image module loads, heavy SVG rendering moved to subprocesses, and obsolete jemalloc preload hacks were removed.",
    outcome: "The main process stays focused on orchestration while native render memory gets reclaimed by process exit.",
    receipts: ["bot.js", "utils/sharpConfig.js", "f3d7e910"]
  }
];

export const botLogTape: BotLogTapeEntry[] = [
  {
    channel: "startup",
    message: "[STARTUP] Phase 1/3 - bootstrap services",
    receipt: "bot.js"
  },
  {
    channel: "cache",
    message: "[UnifiedCache] Redis backend enabled",
    receipt: "utils/unifiedCache.js"
  },
  {
    channel: "analytics",
    message: "[DASHBOARD] Returning stale cache from Redis due to error",
    receipt: "routes/dashboard.js"
  },
  {
    channel: "analytics",
    message: "[DASHBOARD] Falling back to legacy hourly metrics: {mongoError.message}",
    receipt: "routes/dashboard.js"
  },
  {
    channel: "memory",
    message: "[UnifiedCache] Emergency cleanup triggered: {heapUsedMB}MB > {threshold}MB",
    receipt: "utils/unifiedCache.js"
  },
  {
    channel: "shutdown",
    message: "SIGTERM received - performing graceful shutdown...",
    receipt: "bot.js"
  },
  {
    channel: "shutdown",
    message: "[SHUTDOWN] All cleanups completed",
    receipt: "bot.js"
  }
];
