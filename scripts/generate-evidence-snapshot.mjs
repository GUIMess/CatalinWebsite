import fs from "node:fs/promises";
import path from "node:path";
import { existsSync } from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const projectRoot = process.cwd();
const outputPath = path.resolve(projectRoot, "src", "content", "evidence.json");
const execFileAsync = promisify(execFile);

async function detectSiblingBotRepo() {
  const parent = path.resolve(projectRoot, "..");
  if (!existsSync(parent)) {
    return path.resolve(projectRoot, "..", "bot-project");
  }

  const siblings = await fs.readdir(parent, { withFileTypes: true });
  for (const sibling of siblings) {
    if (!sibling.isDirectory()) continue;
    const candidate = path.join(parent, sibling.name);
    const checks = [
      path.join(candidate, "core", "bot-schedulers.js"),
      path.join(candidate, "core", "bot-server.js"),
      path.join(candidate, "commands"),
      path.join(candidate, "services")
    ];
    if (checks.every((target) => existsSync(target))) {
      return candidate;
    }
  }

  return path.resolve(projectRoot, "..", "bot-project");
}

function log(message) {
  process.stdout.write(`[evidence] ${message}\n`);
}

async function runGit(args, cwd) {
  try {
    const { stdout } = await execFileAsync("git", args, {
      cwd,
      windowsHide: true,
      maxBuffer: 1024 * 1024
    });
    return stdout;
  } catch {
    return "";
  }
}

async function readFileSafe(filePath) {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch {
    return "";
  }
}

async function countFiles(dirPath, filterFn = () => true) {
  if (!existsSync(dirPath)) return 0;

  let total = 0;
  const queue = [dirPath];

  while (queue.length) {
    const current = queue.pop();
    if (!current) continue;
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;
      const nextPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        queue.push(nextPath);
        continue;
      }
      if (filterFn(nextPath)) {
        total += 1;
      }
    }
  }

  return total;
}

function computeIntervalMs(raw) {
  if (!raw) return null;
  const clean = raw.replace(/\s+/g, "");
  if (!/^[0-9*]+$/.test(clean)) return null;
  return clean.split("*").reduce((acc, token) => acc * Number(token), 1);
}

function intervalLabel(ms) {
  if (!ms) return "event-driven";
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m`;
  return `${Math.round(ms / 3_600_000)}h`;
}

function extractSchedulerLoops(content) {
  const regex = /markSchedulerStarted\("([^"]+)"(?:,\s*\{\s*intervalMs:\s*([^}]+)\})?\)/g;
  const seen = new Set();
  const loops = [];
  let match = regex.exec(content);

  while (match) {
    const name = match[1];
    if (!seen.has(name)) {
      seen.add(name);
      const intervalMs = computeIntervalMs(match[2] ?? "");
      loops.push({
        name,
        intervalMs,
        interval: intervalLabel(intervalMs)
      });
    }
    match = regex.exec(content);
  }

  return loops;
}

function extractGetEndpoints(content) {
  const regex = /this\.app\.get\("([^"]+)"/g;
  const endpoints = new Set();
  let match = regex.exec(content);

  while (match) {
    const endpoint = match[1];
    if (!endpoint.startsWith("/api/auth")) {
      endpoints.add(endpoint);
    }
    match = regex.exec(content);
  }

  return Array.from(endpoints).sort();
}

function extractCacheNamespaces(content) {
  const configBlock = content.match(/const NAMESPACE_CONFIG = \{([\s\S]*?)\n\};/);
  const target = configBlock ? configBlock[1] : content;
  const regex = /^\s*'([^']+)':\s*\{/gm;
  const namespaces = new Set();
  let match = regex.exec(target);

  while (match) {
    namespaces.add(match[1]);
    match = regex.exec(target);
  }

  return Array.from(namespaces).sort();
}

function extractSchedulerErrorHooks(content) {
  const regex = /markSchedulerError\("([^"]+)"/g;
  const hooks = new Set();
  let match = regex.exec(content);

  while (match) {
    hooks.add(match[1]);
    match = regex.exec(content);
  }

  return Array.from(hooks).sort();
}

function extractNumericConstant(content, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`${escaped}\\s*=\\s*(\\d+)`);
  const match = content.match(regex);
  return match ? Number(match[1]) : null;
}

function extractCriticalErrorThreshold(content) {
  const match = content.match(/errorCount\s*>=\s*(\d+)/);
  return match ? Number(match[1]) : null;
}

function findLine(content, pattern) {
  const lines = content.split(/\r?\n/);
  const index = lines.findIndex((line) => line.includes(pattern));
  return index === -1 ? null : index + 1;
}

function categorizeOpsMove(summary) {
  if (/(auth|csrf|security|permission|rate limit|admin api|health check|hardening)/i.test(summary)) {
    return "security";
  }

  if (/(analytics|activity|graph|metrics|buffer)/i.test(summary)) {
    return "analytics";
  }

  if (/(deploy|memory|shutdown|cache|fallback|scheduler|health|reliability|stale|runtime)/i.test(summary)) {
    return "reliability";
  }

  return "runtime";
}

function parseGitHistory(raw) {
  if (!raw.trim()) {
    return [];
  }

  const commits = [];

  for (const line of raw.split(/\r?\n/)) {
    const [hash, date, ...summaryParts] = line.split("\t");
    const summary = summaryParts.join("\t").trim();
    if (!hash || !date || !summary) {
      continue;
    }

    commits.push({ hash, date, summary });
  }

  return commits;
}

async function getGitHistory(botRepoRoot, limit = 160) {
  const raw = await runGit(
    ["log", "--date=short", "--pretty=format:%h\t%ad\t%s", "-n", String(limit)],
    botRepoRoot
  );
  return parseGitHistory(raw);
}

async function extractRecentOpsMoves(botRepoRoot) {
  const history = await getGitHistory(botRepoRoot, 160);
  if (!history.length) {
    return [];
  }

  const relevantPattern =
    /(auth|csrf|security|permission|rate limit|health|scheduler|analytics|activity|graph|metrics|buffer|deploy|memory|shutdown|cache|fallback|hardening|reliability|runtime|pickem)/i;

  const seenSummaries = new Set();
  const moves = [];

  for (const { hash, date, summary } of history) {
    if (/^merge\b/i.test(summary) || !relevantPattern.test(summary)) {
      continue;
    }

    if (seenSummaries.has(summary)) {
      continue;
    }

    seenSummaries.add(summary);
    moves.push({
      hash,
      date,
      summary,
      category: categorizeOpsMove(summary)
    });

    if (moves.length >= 6) {
      break;
    }
  }

  return moves;
}

function selectCommitsBySummary(history, patterns) {
  const picked = [];
  const seenHashes = new Set();

  for (const pattern of patterns) {
    const commit = history.find((entry) => pattern.test(entry.summary) && !seenHashes.has(entry.hash));
    if (!commit) {
      continue;
    }

    picked.push(commit);
    seenHashes.add(commit.hash);
  }

  return picked;
}

function latestCommitDate(commits) {
  return commits
    .map((commit) => commit.date)
    .sort((a, b) => b.localeCompare(a))[0] ?? null;
}

function buildPressureProfile({
  runtimeTarget,
  schedulerLoops,
  schedulerSource,
  serverSource,
  healthSource,
  dashboardSource,
  unifiedCacheSource,
  botSource
}) {
  const fastLoopThresholdMs = 5 * 60 * 1000;
  const fastLoops = schedulerLoops.filter(
    (loop) => typeof loop.intervalMs === "number" && loop.intervalMs <= fastLoopThresholdMs
  );
  const eventDrivenLoops = schedulerLoops.filter((loop) => loop.intervalMs === null);
  const fastestLoop = schedulerLoops
    .filter((loop) => typeof loop.intervalMs === "number")
    .sort((a, b) => (a.intervalMs ?? 0) - (b.intervalMs ?? 0))[0] ?? null;
  const staleMultiplier = extractNumericConstant(healthSource, "DEFAULT_STALE_MULTIPLIER");
  const criticalErrorThreshold = extractCriticalErrorThreshold(healthSource);
  const cacheNamespaces = extractCacheNamespaces(unifiedCacheSource);
  const schedulerErrorHooks = extractSchedulerErrorHooks(schedulerSource);
  const operatorSurfaces = extractGetEndpoints(serverSource).filter((endpoint) =>
    ["/health", "/status", "/live-updates", "/dashboard"].includes(endpoint)
  );

  const recoveryRails = [
    {
      label: "Scheduler stale downgrade",
      detail: "Heartbeat silence beyond the stale window marks loops degraded before they disappear entirely.",
      file: "utils/schedulerHealth.js",
      line: findLine(healthSource, "if (age !== null && age > maxSilence)")
    },
    {
      label: "Scheduler critical trip",
      detail: "Repeated scheduler errors promote the loop from degraded to critical instead of hiding the failure.",
      file: "utils/schedulerHealth.js",
      line: findLine(healthSource, 'entry.status = entry.errorCount >= 3 ? "critical" : "degraded";')
    },
    {
      label: "Memory-only cache mode",
      detail: "If Redis is unavailable, the runtime stays up on memory cache instead of hard failing.",
      file: "utils/unifiedCache.js",
      line: findLine(unifiedCacheSource, "Redis unavailable, using memory-only mode")
    },
    {
      label: "Emergency cache cleanup",
      detail: "Heap pressure triggers cache flush and optional forced GC before the process spirals.",
      file: "utils/unifiedCache.js",
      line: findLine(unifiedCacheSource, "Emergency cleanup triggered")
    },
    {
      label: "Stale dashboard cache fallback",
      detail: "If fresh analytics fail, the dashboard can serve stale cached output instead of a blank panel.",
      file: "routes/dashboard.js",
      line: findLine(dashboardSource, "Returning stale cache from Redis due to error")
    },
    {
      label: "Legacy analytics fallback",
      detail: "Hourly graphs fall back to older metrics sources when the preferred path returns unusable data.",
      file: "routes/dashboard.js",
      line: findLine(dashboardSource, "Falling back to legacy hourly metrics")
    },
    {
      label: "Graceful shutdown path",
      detail: "Signals trigger structured cleanup instead of dropping the process cold.",
      file: "bot.js",
      line: findLine(botSource, "performing graceful shutdown")
    }
  ].filter((rail) => rail.line !== null);

  return {
    summary: "Build-time, source-derived runtime pressure profile. Snapshot-backed on purpose; not fake live telemetry.",
    metrics: [
      {
        label: "Fastest loop",
        value: fastestLoop ? fastestLoop.interval : "n/a",
        detail: fastestLoop
          ? `${fastestLoop.name} is the tightest scheduled cadence in the bot startup graph.`
          : "No scheduled loops were available in the snapshot."
      },
      {
        label: "Fast loops",
        value: `${fastLoops.length}`,
        detail: `${fastLoops.length} scheduler loops run at 1m-5m cadence and carry the highest heartbeat pressure.`
      },
      {
        label: "Event-driven jobs",
        value: `${eventDrivenLoops.length}`,
        detail: `${eventDrivenLoops.length} jobs stay dormant until work arrives instead of polling constantly.`
      },
      {
        label: "Stale multiplier",
        value: staleMultiplier ? `${staleMultiplier}x` : "n/a",
        detail: "Heartbeat silence is judged against the configured stale window before a loop is treated as degraded."
      },
      {
        label: "Critical trip",
        value: criticalErrorThreshold ? `${criticalErrorThreshold} errs` : "n/a",
        detail: `${schedulerErrorHooks.length} scheduler paths explicitly wire errors into shared health state.`
      },
      {
        label: "Cache namespaces",
        value: `${cacheNamespaces.length}`,
        detail: `${cacheNamespaces.length} explicit memory/Redis namespaces keep cache boundaries visible instead of ad hoc.`
      }
    ],
    operatorSurfaces,
    notes: [
      `Runtime target: ${runtimeTarget}`,
      `${operatorSurfaces.length} public operator surfaces expose health/runtime status`,
      `${recoveryRails.length} recovery rails were detected across cache, analytics, scheduler health, and shutdown paths`
    ],
    recoveryRails
  };
}

function buildIncidentTimeline({
  commitHistory,
  dashboardSource,
  analyticsSource,
  buttonPickemSource,
  botEventsSource,
  serverSource,
  unifiedCacheSource,
  botSource
}) {
  const definitions = [
    {
      id: "analytics-truth",
      category: "analytics",
      title: "Activity graphs stopped lying after restart and hydrate drift",
      summary:
        "Two consecutive fixes repaired graph normalization and rebuilt the hourly buffer when restore paths lost its circular shape.",
      outcome:
        "The dashboard keeps showing current-session pressure instead of flattening to zero after resets, warmup, or fallback paths.",
      logReceipt: "[DASHBOARD] Falling back to legacy hourly metrics: {mongoError.message}",
      commitPatterns: [
        /Fix analytics hourly activity buffer recovery/i,
        /Fix dashboard analytics graph series normalization/i
      ],
      sourceReceipts: [
        {
          label: "Dashboard fallback path",
          file: "routes/dashboard.js",
          line: findLine(dashboardSource, "Falling back to legacy hourly metrics")
        },
        {
          label: "Collector buffer rebuild",
          file: "utils/analyticsCollector.js",
          line: findLine(analyticsSource, "Rebuilding invalid hourlyActivity structure")
        }
      ]
    },
    {
      id: "pickem-boundary",
      category: "runtime",
      title: "Pickem lock boundaries were brought back into one consistent state",
      summary:
        "The disabled-button check, persisted lock flag, and click-time game lookup were aligned so CBB picks stop acting closed while looking open.",
      outcome:
        "Interaction state now matches what the poll communicates instead of splitting between UI and handler behavior.",
      commitPatterns: [/Fix CBB pickem dead-button lock consistency and interaction lookup/i],
      sourceReceipts: [
        {
          label: "Persisted lock boundary",
          file: "utils/buttonPickemSystem.js",
          line: findLine(buttonPickemSource, "const shouldStartLocked = !!(game.isLive || game.isFinal || isPast);")
        },
        {
          label: "Started-game lookup override",
          file: "core/bot-events.js",
          line: findLine(botEventsSource, "includeStarted: true")
        }
      ]
    },
    {
      id: "operator-hardening",
      category: "security",
      title: "Operator access and health visibility were hardened together",
      summary:
        "Health endpoints, live update surfaces, rate limiting, and auth boundaries were tightened in the same layer instead of patched piecemeal.",
      outcome:
        "The runtime stays inspectable to operators while dashboard access paths get stricter and more deliberate.",
      commitPatterns: [
        /Implement full auth, config, health, and CI hardening pass/i,
        /Harden auth and admin APIs; improve rate limiting and health checks/i
      ],
      sourceReceipts: [
        {
          label: "Health route",
          file: "core/bot-server.js",
          line: findLine(serverSource, 'this.app.get("/health"')
        },
        {
          label: "Auth rate limiter",
          file: "core/bot-server.js",
          line: findLine(serverSource, "authLimiter")
        }
      ]
    },
    {
      id: "memory-containment",
      category: "reliability",
      title: "Memory containment moved from deploy folklore to designed rails",
      summary:
        "Native rendering assumptions were simplified, obsolete allocator hacks were removed, and explicit cleanup paths remained in place for cache and shutdown pressure.",
      outcome:
        "High-output periods rely on designed containment and recovery paths instead of hoping the process behaves.",
      logReceipt: "[UnifiedCache] Emergency cleanup triggered: {heapUsedMB}MB > {threshold}MB",
      commitPatterns: [/remove jemalloc/i],
      sourceReceipts: [
        {
          label: "Cache emergency cleanup",
          file: "utils/unifiedCache.js",
          line: findLine(unifiedCacheSource, "Emergency cleanup triggered")
        },
        {
          label: "Graceful shutdown signal",
          file: "bot.js",
          line: findLine(botSource, "performing graceful shutdown")
        }
      ]
    }
  ];

  return definitions
    .map((definition) => {
      const commits = selectCommitsBySummary(commitHistory, definition.commitPatterns);
      if (!commits.length) {
        return null;
      }

      return {
        id: definition.id,
        category: definition.category,
        date: latestCommitDate(commits),
        title: definition.title,
        summary: definition.summary,
        outcome: definition.outcome,
        logReceipt: definition.logReceipt ?? null,
        commits: commits.map((commit) => ({
          hash: commit.hash,
          date: commit.date,
          summary: commit.summary
        })),
        sourceReceipts: definition.sourceReceipts.filter((receipt) => receipt.line !== null)
      };
    })
    .filter(Boolean);
}

function buildOperatorDashboardSnapshot({
  dashboardSource,
  serverSource,
  healthSource,
  railwaySource
}) {
  const readRailwayNumber = (key) => {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`railway:\\s*\\{[\\s\\S]*?${escaped}:\\s*(\\d+)`, "m");
    const match = railwaySource.match(regex);
    return match ? Number(match[1]) : null;
  };

  const memoryThresholds = [
    {
      label: "warning",
      value: readRailwayNumber("warning"),
      note: "early memory warning rail"
    },
    {
      label: "critical",
      value: readRailwayNumber("critical"),
      note: "manual attention territory"
    },
    {
      label: "emergency",
      value: readRailwayNumber("emergency"),
      note: "high-risk process pressure"
    },
    {
      label: "cache flush",
      value: readRailwayNumber("emergencyThresholdMB"),
      note: "unified cache emergency cleanup"
    }
  ]
    .filter((item) => Number.isFinite(item.value))
    .map((item) => ({
      ...item,
      value: `${item.value}MB`
    }));

  const cadenceNotes = [
    {
      label: "bot status cache",
      value: "10s"
    },
    {
      label: "cache emergency monitor",
      value: (() => {
        const interval = readRailwayNumber("cacheEmergencyInterval");
        return interval ? `${Math.round(interval / 60000)}m` : null;
      })()
    },
    {
      label: "aggressive cleanup",
      value: (() => {
        const interval = readRailwayNumber("aggressiveCleanupInterval");
        return interval ? `${Math.round(interval / 60000)}m` : null;
      })()
    }
  ].filter((item) => item.value);

  const panels = [
    {
      title: "Dashboard bot status",
      route: "/api/bot/status",
      badge: "dashboard",
      detail:
        "Operator-facing status surface with bot liveness, uptime, heap usage, ping, and high-level runtime counts.",
      fields: [
        "online",
        "uptime",
        "memory.used",
        "memory.total",
        "memory.external",
        "ping"
      ],
      scrub:
        "Guild, user, and channel totals exist in the live payload but stay redacted here. nodeVersion and platform are also permission-gated.",
      receipts: [
        {
          label: "Status payload fields",
          file: "routes/dashboard.js",
          line: findLine(dashboardSource, "online: isOnline")
        },
        {
          label: "Admin-only field strip",
          file: "routes/dashboard.js",
          line: findLine(dashboardSource, "delete response.nodeVersion;")
        }
      ]
    },
    {
      title: "Public health check",
      route: "/health",
      badge: "public",
      detail:
        "Machine-readable health response for platform pings and deploy verification, including uptime and raw memory usage.",
      fields: ["status", "timestamp", "platform", "uptime", "memory"],
      scrub:
        "The shape is real. Live timestamps, host platform details, and current heap values are intentionally omitted from the portfolio.",
      receipts: [
        {
          label: "Healthy response",
          file: "core/bot-server.js",
          line: findLine(serverSource, "status: 'healthy'")
        },
        {
          label: "Unhealthy fallback",
          file: "core/bot-server.js",
          line: findLine(serverSource, "status: 'unhealthy'")
        }
      ]
    },
    {
      title: "Live update handshake",
      route: "/live-updates",
      badge: "websocket",
      detail:
        "Handshake surface that advertises WebSocket availability, upgrade semantics, and connection count for live operator views.",
      fields: ["protocol", "path", "upgrade", "status", "connections"],
      scrub:
        "Current connection counts and deployment details are hidden, but the real route shape is preserved.",
      receipts: [
        {
          label: "WebSocket status payload",
          file: "core/bot-server.js",
          line: findLine(serverSource, 'path: "/live-updates"')
        }
      ]
    },
    {
      title: "Scheduler health snapshot",
      route: "internal snapshot",
      badge: "health-model",
      detail:
        "Loop health is derived from overall status, schedulerCount, heartbeat age, stale thresholds, and consecutive error state.",
      fields: ["status", "schedulerCount", "timestamp", "heartbeatAgeMs", "staleThresholdMs", "errorCount"],
      scrub:
        "Per-loop live ages and current errors remain redacted here, but the model mirrors the real health snapshot contract.",
      receipts: [
        {
          label: "Snapshot envelope",
          file: "utils/schedulerHealth.js",
          line: findLine(healthSource, "schedulerCount: schedulerRegistry.size")
        },
        {
          label: "Stale threshold logic",
          file: "utils/schedulerHealth.js",
          line: findLine(healthSource, "staleThresholdMs: maxSilence")
        }
      ]
    }
  ].map((panel) => ({
    ...panel,
    receipts: panel.receipts.filter((receipt) => receipt.line !== null)
  }));

  return {
    summary:
      "Sanitized view of the bot's real operator surfaces. Field names and thresholds are source-backed; live values are deliberately withheld.",
    panels,
    memoryThresholds,
    cadenceNotes,
    accessRules: [
      "nodeVersion and platform are stripped from bot status unless the caller has system-admin permission",
      "public health and live-update routes stay machine-readable, but this portfolio removes current timestamps, live counts, and deployment identity",
      "guild, user, and channel totals exist in the live dashboard payload and are intentionally omitted here"
    ]
  };
}

async function generateSnapshot() {
  const botRepoRoot = process.env.BOT_REPO_PATH
    ? path.resolve(process.env.BOT_REPO_PATH)
    : await detectSiblingBotRepo();

  if (!existsSync(botRepoRoot)) {
    log(`Bot repo not found at ${botRepoRoot}. Keeping existing evidence snapshot.`);
    return;
  }

  const commandsDir = path.join(botRepoRoot, "commands");
  const servicesDir = path.join(botRepoRoot, "services");
  const testsDir = path.join(botRepoRoot, "tests");
  const dashboardDir = path.join(botRepoRoot, "dashboard");
  const schedulerFile = path.join(botRepoRoot, "core", "bot-schedulers.js");
  const serverFile = path.join(botRepoRoot, "core", "bot-server.js");
  const healthFile = path.join(botRepoRoot, "utils", "schedulerHealth.js");
  const analyticsCollectorFile = path.join(botRepoRoot, "utils", "analyticsCollector.js");
  const dashboardRoutesFile = path.join(botRepoRoot, "routes", "dashboard.js");
  const unifiedCacheFile = path.join(botRepoRoot, "utils", "unifiedCache.js");
  const buttonPickemFile = path.join(botRepoRoot, "utils", "buttonPickemSystem.js");
  const botEventsFile = path.join(botRepoRoot, "core", "bot-events.js");
  const botFile = path.join(botRepoRoot, "bot.js");
  const railwayFile = path.join(botRepoRoot, "config", "railwayConfig.js");
  const packageFile = path.join(botRepoRoot, "package.json");

  const [
    schedulerSource,
    serverSource,
    healthSource,
    analyticsSource,
    dashboardSource,
    unifiedCacheSource,
    buttonPickemSource,
    botEventsSource,
    botSource,
    railwaySource,
    packageSource
  ] = await Promise.all([
    readFileSafe(schedulerFile),
    readFileSafe(serverFile),
    readFileSafe(healthFile),
    readFileSafe(analyticsCollectorFile),
    readFileSafe(dashboardRoutesFile),
    readFileSafe(unifiedCacheFile),
    readFileSafe(buttonPickemFile),
    readFileSafe(botEventsFile),
    readFileSafe(botFile),
    readFileSafe(railwayFile),
    readFileSafe(packageFile)
  ]);

  const [commandModules, serviceModules, testFiles, dashboardTsxFiles] = await Promise.all([
    countFiles(commandsDir, (filePath) => filePath.endsWith(".js")),
    countFiles(servicesDir, (filePath) => filePath.endsWith(".js")),
    countFiles(testsDir),
    countFiles(dashboardDir, (filePath) => filePath.endsWith(".tsx"))
  ]);

  let runtimeTarget = "unknown";
  try {
    const parsed = JSON.parse(packageSource);
    runtimeTarget = parsed?.engines?.node ? `Node ${parsed.engines.node}` : "unknown";
  } catch {
    runtimeTarget = "unknown";
  }

  const schedulerLoops = extractSchedulerLoops(schedulerSource);
  const endpoints = extractGetEndpoints(serverSource);
  const commitHistory = await getGitHistory(botRepoRoot, 200);
  const recentOpsMoves = await extractRecentOpsMoves(botRepoRoot);
  const pressureProfile = buildPressureProfile({
    runtimeTarget,
    schedulerLoops,
    schedulerSource,
    serverSource,
    healthSource,
    dashboardSource,
    unifiedCacheSource,
    botSource
  });
  const operatorDashboardSnapshot = buildOperatorDashboardSnapshot({
    dashboardSource,
    serverSource,
    healthSource,
    railwaySource
  });
  const incidentTimeline = buildIncidentTimeline({
    commitHistory,
    dashboardSource,
    analyticsSource,
    buttonPickemSource,
    botEventsSource,
    serverSource,
    unifiedCacheSource,
    botSource
  });

  const receipts = [
    {
      label: "Scheduler orchestration boot",
      file: "core/bot-schedulers.js",
      line: findLine(schedulerSource, "startAllSchedulers()"),
      signal: "Centralized startup path and scheduler registration."
    },
    {
      label: "Health endpoint",
      file: "core/bot-server.js",
      line: findLine(serverSource, 'this.app.get("/health"'),
      signal: "Operational runtime health surface for deploy/platform checks."
    },
    {
      label: "Heartbeat stale logic",
      file: "utils/schedulerHealth.js",
      line: findLine(healthSource, "computeEntryHealth"),
      signal: "Per-loop stale detection and degraded/critical status calculation."
    },
    {
      label: "WebSocket runtime updates",
      file: "core/bot-server.js",
      line: findLine(serverSource, "initializeWebSocket"),
      signal: "Dashboard update channel for live operator visibility."
    }
  ].filter((item) => item.line !== null);

  const snapshot = {
    generatedAt: new Date().toISOString(),
    source: {
      repo: "sanitized sibling bot repository",
      pathHint: "external-bot-repo"
    },
    counts: {
      commandModules,
      serviceModules,
      schedulerLoops: schedulerLoops.length,
      testFiles,
      dashboardTsxFiles,
      runtimeTarget
    },
    schedulerLoops,
    endpoints,
    operatorDashboardSnapshot,
    pressureProfile,
    incidentTimeline,
    recentOpsMoves,
    receipts
  };

  await fs.writeFile(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  log(`Wrote snapshot: ${outputPath}`);
}

await generateSnapshot();
