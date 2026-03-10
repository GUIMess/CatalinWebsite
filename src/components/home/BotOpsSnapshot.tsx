import { useMemo, useState } from "react";
import evidence from "../../content/evidence.json";
import { clamp } from "../../lib/math";

type RuntimePreset = "normal" | "peak" | "outage";

type BotState = {
  ingestionLoad: number;
  queueDepth: number;
  dedupeStrictness: number;
  fallbackEnabled: boolean;
};

type Module = {
  id: string;
  name: string;
  role: string;
};

type EvidenceSnapshot = {
  generatedAt: string;
  counts: {
    commandModules: number;
    serviceModules: number;
    schedulerLoops: number;
    testFiles: number;
    dashboardTsxFiles: number;
    runtimeTarget: string;
  };
  schedulerLoops: Array<{
    name: string;
    interval: string;
    intervalMs: number | null;
  }>;
  endpoints: string[];
};

const modules: Module[] = [
  { id: "ingest", name: "Ingestion", role: "Pulls schedule and event updates from multiple providers." },
  { id: "normalize", name: "Normalizer", role: "Converts messy upstream payloads into one clean schema." },
  { id: "rules", name: "Rules Engine", role: "Scores event importance and routes messages by audience." },
  { id: "dispatch", name: "Dispatch Queue", role: "Queues and sends messages with retry and backoff." }
];

const snapshot = evidence as EvidenceSnapshot;

const proofStats = [
  { label: "Command modules", value: `${snapshot.counts.commandModules}` },
  { label: "Service modules", value: `${snapshot.counts.serviceModules}` },
  { label: "Automated test files", value: `${snapshot.counts.testFiles}` },
  { label: "Scheduler loops", value: `${snapshot.counts.schedulerLoops}` },
  { label: "Dashboard TSX files", value: `${snapshot.counts.dashboardTsxFiles}` },
  { label: "Runtime target", value: snapshot.counts.runtimeTarget }
];

const initialState: BotState = {
  ingestionLoad: 54,
  queueDepth: 22,
  dedupeStrictness: 66,
  fallbackEnabled: true
};

export function BotOpsSnapshot() {
  const [preset, setPreset] = useState<RuntimePreset>("normal");
  const [state, setState] = useState<BotState>(initialState);
  const [activeModuleId, setActiveModuleId] = useState<string>(modules[0].id);

  const activeModule = modules.find((module) => module.id === activeModuleId) ?? modules[0];
  const generatedAtLabel = useMemo(() => {
    const date = new Date(snapshot.generatedAt);
    if (Number.isNaN(date.getTime())) {
      return "unknown";
    }
    return `${date.toLocaleDateString("en-US")} ${date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
  }, []);
  const fastLoops = useMemo(() => {
    return snapshot.schedulerLoops
      .filter((loop) => loop.intervalMs !== null)
      .sort((a, b) => (a.intervalMs ?? 0) - (b.intervalMs ?? 0))
      .slice(0, 4);
  }, []);

  const metrics = useMemo(() => {
    const latency = clamp(
      120 + state.ingestionLoad * 3.1 + state.queueDepth * 5.2 - state.dedupeStrictness * 0.8 - (state.fallbackEnabled ? 28 : 0),
      80,
      2200
    );
    const duplicateRate = clamp(
      40 + state.ingestionLoad * 0.4 - state.dedupeStrictness * 0.45 + (state.fallbackEnabled ? -6 : 8),
      1,
      80
    );
    const missRate = clamp(
      7 + state.queueDepth * 0.45 + (state.fallbackEnabled ? -2 : 7) + (state.dedupeStrictness > 86 ? 9 : 0),
      0,
      45
    );

    return {
      latency: Math.round(latency),
      duplicateRate: Math.round(duplicateRate),
      missRate: Math.round(missRate)
    };
  }, [state]);

  const applyNormal = () => {
    setPreset("normal");
    setState({ ingestionLoad: 54, queueDepth: 22, dedupeStrictness: 66, fallbackEnabled: true });
  };

  const applyPeak = () => {
    setPreset("peak");
    setState({ ingestionLoad: 88, queueDepth: 61, dedupeStrictness: 74, fallbackEnabled: true });
  };

  const applyOutage = () => {
    setPreset("outage");
    setState({ ingestionLoad: 92, queueDepth: 79, dedupeStrictness: 58, fallbackEnabled: false });
  };

  const mutateState = (update: Partial<BotState>) => {
    setPreset("normal");
    setState((prev) => ({
      ingestionLoad: clamp(update.ingestionLoad ?? prev.ingestionLoad, 0, 100),
      queueDepth: clamp(update.queueDepth ?? prev.queueDepth, 0, 100),
      dedupeStrictness: clamp(update.dedupeStrictness ?? prev.dedupeStrictness, 0, 100),
      fallbackEnabled: update.fallbackEnabled ?? prev.fallbackEnabled
    }));
  };

  return (
    <section className="surface">
      <p className="eyebrow">Runtime Model</p>
      <h2>Push the bot pipeline and watch the operating tradeoffs move.</h2>
      <p>
        Change load, queue depth, dedupe strictness, and fallback behavior to see how latency, duplicate
        risk, and missed-event risk shift.
      </p>
      <p className="muted">Evidence snapshot refreshed: {generatedAtLabel}</p>

      <div className="bot-proof-grid">
        {proofStats.map((stat) => (
          <article key={stat.label} className="card bot-proof-card">
            <p className="tag">{stat.label}</p>
            <h3>{stat.value}</h3>
          </article>
        ))}
      </div>

      <div className="button-row">
        <button className={preset === "normal" ? "chip active" : "chip"} onClick={applyNormal} type="button">
          normal window
        </button>
        <button className={preset === "peak" ? "chip active" : "chip"} onClick={applyPeak} type="button">
          peak traffic
        </button>
        <button className={preset === "outage" ? "chip active danger" : "chip"} onClick={applyOutage} type="button">
          provider outage
        </button>
      </div>

      <div className="bot-ops-grid">
        <article className="card">
          <h3>Pipeline Modules</h3>
          <div className="button-row">
            {modules.map((module) => (
              <button
                key={module.id}
                className={module.id === activeModule.id ? "chip active" : "chip"}
                onClick={() => setActiveModuleId(module.id)}
                type="button"
              >
                {module.name}
              </button>
            ))}
          </div>
          <p className="muted">{activeModule.role}</p>
          <div className="control-stat-list">
            <div className="metric-row">
              <span>Ingestion load</span>
              <strong>{state.ingestionLoad}</strong>
            </div>
            <div className="metric-row">
              <span>Queue depth</span>
              <strong>{state.queueDepth}</strong>
            </div>
            <div className="metric-row">
              <span>Dedupe strictness</span>
              <strong>{state.dedupeStrictness}</strong>
            </div>
            <div className="metric-row">
              <span>Fallback provider</span>
              <strong>{state.fallbackEnabled ? "enabled" : "disabled"}</strong>
            </div>
          </div>

          <div className="button-row compact">
            <button
              className="chip danger"
              onClick={() =>
                mutateState({
                  ingestionLoad: state.ingestionLoad + 16,
                  queueDepth: state.queueDepth + 20
                })
              }
              type="button"
            >
              inject burst
            </button>
            <button
              className="chip"
              onClick={() => mutateState({ queueDepth: state.queueDepth - 26, ingestionLoad: state.ingestionLoad - 10 })}
              type="button"
            >
              drain queue
            </button>
            <button className="chip" onClick={() => mutateState({ dedupeStrictness: state.dedupeStrictness + 12 })} type="button">
              tighten dedupe
            </button>
            <button className="chip" onClick={() => mutateState({ dedupeStrictness: state.dedupeStrictness - 12 })} type="button">
              relax dedupe
            </button>
            <button className="chip" onClick={() => mutateState({ fallbackEnabled: !state.fallbackEnabled })} type="button">
              toggle fallback
            </button>
          </div>
        </article>

        <article className="card">
          <h3>Runtime Signals</h3>
          <div className="metric-row">
            <span>Alert latency</span>
            <strong>{metrics.latency}ms</strong>
          </div>
          <div className="meter">
            <div className="fill warn" style={{ width: `${Math.min(100, Math.round(metrics.latency / 22))}%` }} />
          </div>

          <div className="metric-row">
            <span>Duplicate message risk</span>
            <strong>{metrics.duplicateRate}%</strong>
          </div>
          <div className="meter">
            <div className="fill bad" style={{ width: `${metrics.duplicateRate}%` }} />
          </div>

          <div className="metric-row">
            <span>Missed event risk</span>
            <strong>{metrics.missRate}%</strong>
          </div>
          <div className="meter">
            <div className="fill warn" style={{ width: `${metrics.missRate * 2}%` }} />
          </div>

          <p className="sim-reco">
            {metrics.duplicateRate > 35
              ? "Duplicates are too high. Tighten fingerprinting before scaling traffic."
              : metrics.missRate > 20
                ? "Message drops likely. Reduce queue pressure and re-check fallback behavior."
                : "System is stable for current load. Keep monitoring upstream provider quality."}
          </p>
        </article>
      </div>

      <div className="bot-ops-grid">
        <article className="card">
          <h3>Fast Scheduler Loops</h3>
          <div className="control-stat-list">
            {fastLoops.map((loop) => (
              <div className="metric-row" key={loop.name}>
                <span>{loop.name}</span>
                <strong>{loop.interval}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="card">
          <h3>Ops Endpoints</h3>
          <p className="muted">Sanitized runtime surfaces exposed by the production server.</p>
          <div className="control-stat-list">
            {snapshot.endpoints.slice(0, 6).map((endpoint) => (
              <div className="metric-row" key={endpoint}>
                <span>{endpoint}</span>
                <strong>active</strong>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
