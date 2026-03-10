import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Experiment } from "../../types/content";
import { clamp } from "../../lib/math";

type ExperimentWorkbenchProps = {
  experiment: Experiment | null;
};

type OutputMetric = {
  label: string;
  value: string;
};

type WorkbenchOutput = {
  title: string;
  recommendation: string;
  metrics: OutputMetric[];
  visual: ReactNode;
};

function meterWidth(value: number): string {
  return `${clamp(Math.round(value), 0, 100)}%`;
}

function buildRetryOutput(a: number, b: number, flag: boolean): WorkbenchOutput {
  const retries = Math.round(clamp(a / 18, 1, 6));
  const baseDelay = Math.round(clamp(b * 22, 120, 2200));
  const totalWait = Math.round(baseDelay * (Math.pow(2, retries) - 1));
  const burstRisk = clamp(78 - retries * 6 - baseDelay / 120 + (flag ? -9 : 11), 2, 99);
  const jitterText = flag ? "jitter on" : "jitter off";
  const attempts = Array.from({ length: retries }, (_, index) => {
    const rawDelay = Math.round(baseDelay * Math.pow(2, index));
    const displayedDelay = flag ? Math.round(rawDelay * (index % 2 === 0 ? 0.92 : 1.08)) : rawDelay;
    return {
      label: `attempt ${index + 1}`,
      delay: displayedDelay,
      width: clamp((displayedDelay / Math.max(totalWait, 1)) * 100, 18, 100)
    };
  });

  return {
    title: "Retry Backoff Tuner",
    recommendation:
      burstRisk > 50
        ? "Retry policy is too aggressive for unstable upstreams."
        : "Backoff curve looks safe for burst outages.",
    metrics: [
      { label: "Retries", value: `${retries}` },
      { label: "Base delay", value: `${baseDelay}ms` },
      { label: "Total retry wait", value: `${totalWait}ms` },
      { label: "Burst risk", value: `${Math.round(burstRisk)}%` }
    ],
    visual: (
      <div className="workbench-visual-shell retry-stage">
        <div className="workbench-stage-head">
          <span>Example retry lane</span>
          <strong>{burstRisk > 50 ? "storm risk" : "recovery path"}</strong>
        </div>
        <div className="retry-track">
          {attempts.map((attempt) => (
            <article className="retry-attempt" key={attempt.label}>
              <div className="retry-attempt-head">
                <span>{attempt.label}</span>
                <strong>{attempt.delay}ms</strong>
              </div>
              <div className="meter">
                <div className="fill good" style={{ width: `${attempt.width}%` }} />
              </div>
            </article>
          ))}
        </div>
        <p className="workbench-visual-note">
          Provider recovery with {jitterText}; shorter bars mean the system can probe upstream health without amplifying the outage.
        </p>
      </div>
    )
  };
}

function buildCacheOutput(a: number, b: number, flag: boolean): WorkbenchOutput {
  const ttl = Math.round(clamp(a * 2.2, 15, 220));
  const traffic = Math.round(clamp(b, 5, 100));
  const freshness = clamp(92 - ttl * 0.22 - traffic * 0.15 + (flag ? 9 : -7), 2, 99);
  const apiLoad = clamp(18 + traffic * 0.7 - ttl * 0.25 + (flag ? 8 : -3), 1, 99);
  const rows = [
    {
      label: "scores",
      freshness: clamp(freshness + 8, 0, 100),
      load: clamp(apiLoad + 12, 0, 100)
    },
    {
      label: "schedules",
      freshness: clamp(freshness - 2, 0, 100),
      load: clamp(apiLoad - 8, 0, 100)
    },
    {
      label: "rankings",
      freshness: clamp(freshness - 9, 0, 100),
      load: clamp(apiLoad - 16, 0, 100)
    }
  ];

  return {
    title: "Cache TTL Ladder",
    recommendation:
      freshness < 55
        ? "TTL is too high for live updates."
        : apiLoad > 65
          ? "API pressure is too high; increase TTL or reduce fanout."
          : "Freshness and API load are in a healthy range.",
    metrics: [
      { label: "TTL", value: `${ttl}s` },
      { label: "Traffic", value: `${traffic}` },
      { label: "Data freshness", value: `${Math.round(freshness)}%` },
      { label: "API load", value: `${Math.round(apiLoad)}%` }
    ],
    visual: (
      <div className="workbench-visual-shell ttl-stage">
        <div className="workbench-stage-head">
          <span>Cache ladder</span>
          <strong>{flag ? "prewarm active" : "cold reads only"}</strong>
        </div>
        <div className="ttl-ladder">
          {rows.map((row) => (
            <article className="ttl-card" key={row.label}>
              <div className="ttl-card-head">
                <span>{row.label}</span>
                <strong>{ttl}s</strong>
              </div>
              <div className="ttl-stat-row">
                <small>freshness</small>
                <small>{Math.round(row.freshness)}%</small>
              </div>
              <div className="meter">
                <div className="fill good" style={{ width: meterWidth(row.freshness) }} />
              </div>
              <div className="ttl-stat-row">
                <small>API load</small>
                <small>{Math.round(row.load)}%</small>
              </div>
              <div className="meter">
                <div className="fill warn" style={{ width: meterWidth(row.load) }} />
              </div>
            </article>
          ))}
        </div>
      </div>
    )
  };
}

function buildHeartbeatOutput(a: number, b: number, flag: boolean): WorkbenchOutput {
  const heartbeatAge = Math.round(clamp(a * 12, 30, 1200));
  const staleThreshold = Math.round(clamp(b * 14, 45, 1400));
  const stale = heartbeatAge > staleThreshold || !flag;
  const bars = Array.from({ length: 8 }, (_, index) => {
    const height = clamp(((index % 3) + 1) * 18 + (index === 6 ? heartbeatAge / 20 : 0), 18, 96);
    return {
      id: index,
      height,
      stale: stale && index >= 6
    };
  });

  return {
    title: "Scheduler Heartbeat View",
    recommendation: stale
      ? "Marked stale: trigger restart path and degrade status."
      : "Heartbeat is healthy within threshold.",
    metrics: [
      { label: "Heartbeat age", value: `${heartbeatAge}ms` },
      { label: "Stale threshold", value: `${staleThreshold}ms` },
      { label: "Status", value: stale ? "degraded" : "healthy" },
      { label: "Auto-heal", value: flag ? "enabled" : "disabled" }
    ],
    visual: (
      <div className="workbench-visual-shell heartbeat-stage">
        <div className="workbench-stage-head">
          <span>Heartbeat trace</span>
          <strong>{stale ? "stale signal" : "healthy pulse"}</strong>
        </div>
        <div className="heartbeat-wave">
          {bars.map((bar) => (
            <div className={bar.stale ? "heartbeat-bar stale" : "heartbeat-bar"} key={bar.id} style={{ height: `${bar.height}px` }} />
          ))}
        </div>
        <div className="heartbeat-meta">
          <span>last beat {heartbeatAge}ms ago</span>
          <span>{flag ? "auto-heal armed" : "manual recovery only"}</span>
        </div>
      </div>
    )
  };
}

function buildQueueOutput(a: number, b: number, flag: boolean): WorkbenchOutput {
  const incoming = Math.round(clamp(a * 2.2, 10, 220));
  const throughput = Math.round(clamp(b * 2.1, 10, 210));
  const backlogDelta = incoming - throughput + (flag ? -8 : 7);
  const backlog = clamp(Math.round(Math.abs(backlogDelta) / 12), 1, 7);
  const incomingBlocks = clamp(Math.round(incoming / 32), 2, 7);
  const throughputBlocks = clamp(Math.round(throughput / 34), 2, 7);

  return {
    title: "Queue Burst Sim",
    recommendation:
      backlogDelta > 20
        ? "Backlog will grow fast: add workers or shed non-critical jobs."
        : backlogDelta > 0
          ? "Slight queue growth: watch burst windows."
          : "Throughput can absorb current incoming rate.",
    metrics: [
      { label: "Incoming jobs/min", value: `${incoming}` },
      { label: "Worker throughput/min", value: `${throughput}` },
      { label: "Backlog delta", value: `${backlogDelta > 0 ? "+" : ""}${backlogDelta}` },
      { label: "Priority routing", value: flag ? "on" : "off" }
    ],
    visual: (
      <div className="workbench-visual-shell queue-stage">
        <div className="workbench-stage-head">
          <span>Queue lanes</span>
          <strong>{backlogDelta > 0 ? "backlog growing" : "throughput ahead"}</strong>
        </div>
        <div className="queue-columns">
          <article className="queue-column">
            <span>incoming</span>
            <div className="queue-stack">
              {Array.from({ length: incomingBlocks }, (_, index) => (
                <div className="queue-pill" key={`incoming-${index}`} />
              ))}
            </div>
          </article>
          <article className="queue-column">
            <span>workers</span>
            <div className="queue-stack">
              {Array.from({ length: throughputBlocks }, (_, index) => (
                <div className="queue-pill queue-pill-good" key={`workers-${index}`} />
              ))}
            </div>
          </article>
          <article className="queue-column">
            <span>backlog</span>
            <div className="queue-stack">
              {Array.from({ length: backlog }, (_, index) => (
                <div className={backlogDelta > 0 ? "queue-pill queue-pill-warn" : "queue-pill"} key={`backlog-${index}`} />
              ))}
            </div>
          </article>
        </div>
        <p className="workbench-visual-note">
          {flag ? "Priority routing keeps urgent jobs closer to the front." : "Without priority routing, the queue behaves like a flat pile."}
        </p>
      </div>
    )
  };
}

function buildFingerprintOutput(a: number, b: number, flag: boolean): WorkbenchOutput {
  const strictness = Math.round(clamp(a, 0, 100));
  const payloadVariance = Math.round(clamp(b, 0, 100));
  const duplicateRate = clamp(74 - strictness * 0.6 + payloadVariance * 0.32, 1, 90);
  const missRate = clamp(5 + strictness * 0.42 + (flag ? -3 : 8), 0, 70);
  const events = [
    {
      label: "score update / seq 442",
      state: duplicateRate > 38 ? "duplicate" : "accepted"
    },
    {
      label: "score update / replay",
      state: duplicateRate > 26 ? "suppressed" : "accepted"
    },
    {
      label: "injury note / missing id",
      state: missRate > 20 ? "missed" : "accepted"
    },
    {
      label: "clock drift / provider patch",
      state: strictness > 70 && !flag ? "missed" : "accepted"
    }
  ];

  return {
    title: "Event Fingerprint Audit",
    recommendation:
      missRate > 22
        ? "Fingerprinting is too strict; likely suppressing valid events."
        : duplicateRate > 30
          ? "Duplicate risk still too high; tighten keys."
          : "Dedupe profile looks balanced.",
    metrics: [
      { label: "Strictness", value: `${strictness}` },
      { label: "Payload variance", value: `${payloadVariance}` },
      { label: "Duplicate risk", value: `${Math.round(duplicateRate)}%` },
      { label: "Miss risk", value: `${Math.round(missRate)}%` }
    ],
    visual: (
      <div className="workbench-visual-shell fingerprint-stage">
        <div className="workbench-stage-head">
          <span>Replay sample</span>
          <strong>{flag ? "fallback keys on" : "strict keys only"}</strong>
        </div>
        <div className="fingerprint-list">
          {events.map((event) => (
            <article className={`fingerprint-event ${event.state}`} key={event.label}>
              <span>{event.label}</span>
              <strong>{event.state}</strong>
            </article>
          ))}
        </div>
      </div>
    )
  };
}

function buildAuthOutput(a: number, b: number, flag: boolean): WorkbenchOutput {
  const sessionTtl = Math.round(clamp(a * 0.9, 15, 90));
  const attemptRate = Math.round(clamp(b, 0, 100));
  const abuseRisk = clamp(14 + attemptRate * 0.55 - sessionTtl * 0.22 + (flag ? -10 : 12), 1, 99);
  const steps = [
    { label: "login", state: attemptRate > 70 ? "warn" : "good", detail: `${attemptRate}/100 attempt rate` },
    { label: "session", state: sessionTtl < 25 ? "warn" : "good", detail: `${sessionTtl} min ttl` },
    { label: "csrf", state: flag ? "good" : "warn", detail: flag ? "rotating" : "static" },
    { label: "role gate", state: abuseRisk > 55 ? "warn" : "good", detail: "admin-only route" }
  ];

  return {
    title: "Dashboard Auth Flow",
    recommendation:
      abuseRisk > 50
        ? "Risk is high: enforce stricter session/CSRF controls."
        : "Auth surface risk is manageable for current traffic.",
    metrics: [
      { label: "Session TTL", value: `${sessionTtl} min` },
      { label: "Login attempt rate", value: `${attemptRate}` },
      { label: "CSRF rotate", value: flag ? "enabled" : "disabled" },
      { label: "Abuse risk", value: `${Math.round(abuseRisk)}%` }
    ],
    visual: (
      <div className="workbench-visual-shell auth-stage">
        <div className="workbench-stage-head">
          <span>Admin route</span>
          <strong>{abuseRisk > 50 ? "hardening required" : "manageable risk"}</strong>
        </div>
        <div className="auth-flow">
          {steps.map((step) => (
            <article className={`auth-step ${step.state}`} key={step.label}>
              <span>{step.label}</span>
              <strong>{step.detail}</strong>
            </article>
          ))}
        </div>
      </div>
    )
  };
}

function buildDepthOutput(a: number, b: number, flag: boolean): WorkbenchOutput {
  const depth = clamp(Math.round(a), 10, 100);
  const density = clamp(Math.round(b), 10, 100);
  const layers = [
    { label: "queue", signal: `${Math.round(density * 0.8)} jobs`, color: "queue", z: Math.round(depth * 0.2) },
    { label: "scheduler", signal: `${Math.round(100 - density * 0.35)}% healthy`, color: "scheduler", z: Math.round(depth * 0.45) },
    { label: "provider", signal: `${Math.round(40 + depth * 0.35)}ms lag`, color: "provider", z: Math.round(depth * 0.7) },
    { label: "cache", signal: `${Math.round(50 + (100 - density) * 0.3)}% warm`, color: "cache", z: Math.round(depth * 0.95) }
  ];

  return {
    title: "Ops Depth Map",
    recommendation:
      flag
        ? "The layered view gets much more usable once each slice is explicitly labeled."
        : "Without labels, the depth effect becomes interesting but harder to trust under pressure.",
    metrics: [
      { label: "Depth exaggeration", value: `${depth}` },
      { label: "Signal density", value: `${density}` },
      { label: "Layer labels", value: flag ? "on" : "off" },
      { label: "Readability", value: flag ? "improved" : "fragile" }
    ],
    visual: (
      <div className="workbench-visual-shell depth-stage">
        <div className="workbench-stage-head">
          <span>3d ops stack</span>
          <strong>{flag ? "labels on" : "labels off"}</strong>
        </div>
        <div className="depth-stack">
          {layers.map((layer, index) => (
            <article
              className={`depth-layer depth-layer-${layer.color}`}
              key={layer.label}
              style={{
                transform: `translateZ(${layer.z}px) translateY(${index * -14}px)`,
                opacity: 0.72 + index * 0.06
              }}
            >
              {flag ? (
                <>
                  <span>{layer.label}</span>
                  <strong>{layer.signal}</strong>
                </>
              ) : (
                <strong>{index + 1}</strong>
              )}
            </article>
          ))}
        </div>
        <p className="workbench-visual-note">
          This is the actual 3d experiment: depth and density sliders change the stack, and the label toggle shows why novelty alone was not enough.
        </p>
      </div>
    )
  };
}

function buildExperimentOutput(experiment: Experiment, a: number, b: number, flag: boolean): WorkbenchOutput {
  switch (experiment.id) {
    case "retry-backoff-tuner":
      return buildRetryOutput(a, b, flag);
    case "cache-ttl-ladder":
      return buildCacheOutput(a, b, flag);
    case "scheduler-heartbeat-view":
      return buildHeartbeatOutput(a, b, flag);
    case "queue-burst-sim":
      return buildQueueOutput(a, b, flag);
    case "event-fingerprint-audit":
      return buildFingerprintOutput(a, b, flag);
    case "dashboard-auth-flow":
      return buildAuthOutput(a, b, flag);
    case "ops-depth-map":
      return buildDepthOutput(a, b, flag);
    default:
      return {
        title: experiment.title,
        recommendation: experiment.result,
        metrics: [
          { label: experiment.controls.a, value: `${a}` },
          { label: experiment.controls.b, value: `${b}` },
          { label: experiment.controls.flag, value: flag ? "on" : "off" }
        ],
        visual: <div className="workbench-visual-shell"><p>No visual stage available yet.</p></div>
      };
  }
}

export function ExperimentWorkbench({ experiment }: ExperimentWorkbenchProps) {
  const [a, setA] = useState(50);
  const [b, setB] = useState(50);
  const [flag, setFlag] = useState(true);
  const [profile, setProfile] = useState<"balanced" | "stress" | "safe" | "custom">("balanced");

  useEffect(() => {
    setProfile("balanced");
    setA(52);
    setB(48);
    setFlag(true);
  }, [experiment?.id]);

  const applyProfile = (next: "balanced" | "stress" | "safe") => {
    setProfile(next);
    if (next === "stress") {
      setA(87);
      setB(82);
      setFlag(false);
      return;
    }
    if (next === "safe") {
      setA(42);
      setB(33);
      setFlag(true);
      return;
    }
    setA(52);
    setB(48);
    setFlag(true);
  };

  const randomizeState = () => {
    setProfile("custom");
    setA(Math.round(Math.random() * 100));
    setB(Math.round(Math.random() * 100));
    setFlag(Math.random() > 0.5);
  };

  const output = useMemo(() => {
    if (!experiment) {
      return {
        title: "Select an experiment",
        recommendation: "Pick a card to load the workbench.",
        metrics: [] as OutputMetric[],
        visual: null
      };
    }
    return buildExperimentOutput(experiment, a, b, flag);
  }, [a, b, flag, experiment]);

  if (!experiment) {
    return (
      <article className="card playground-workbench">
        <h3>Select an experiment</h3>
      </article>
    );
  }

  return (
    <article key={experiment.id} className="card playground-workbench panel-enter">
      <div className="experiment-card-head">
        <p className="tag">{experiment.category} experiment</p>
        <span className={`playground-status-pill playground-status-pill-${experiment.status}`}>{experiment.status}</span>
      </div>
      <h3>{output.title}</h3>
      <p>{experiment.summary}</p>
      <p className="workbench-question">{experiment.question}</p>

      <div className="playground-focus-inline">
        <div className="playground-focus-inline-card">
          <span>Applied to</span>
          <strong>{experiment.appliedTo}</strong>
        </div>
        <div className="playground-focus-inline-card">
          <span>What changed</span>
          <strong>{experiment.result}</strong>
        </div>
      </div>

      <div className="button-row compact workbench-presets">
        <button className={profile === "balanced" ? "chip active" : "chip"} onClick={() => applyProfile("balanced")} type="button">
          balanced
        </button>
        <button className={profile === "stress" ? "chip active danger" : "chip"} onClick={() => applyProfile("stress")} type="button">
          stress
        </button>
        <button className={profile === "safe" ? "chip active" : "chip"} onClick={() => applyProfile("safe")} type="button">
          safe
        </button>
        <button className={profile === "custom" ? "chip active danger" : "chip"} onClick={randomizeState} type="button">
          custom random
        </button>
      </div>

      <div className="workbench-control-grid">
        <label className="workbench-slider-row">
          <div className="metric-row">
            <span>{experiment.controls.a}</span>
            <strong>{a}</strong>
          </div>
          <input
            className="workbench-slider"
            type="range"
            min="0"
            max="100"
            value={a}
            onChange={(event) => {
              setProfile("custom");
              setA(Number(event.target.value));
            }}
          />
        </label>

        <label className="workbench-slider-row">
          <div className="metric-row">
            <span>{experiment.controls.b}</span>
            <strong>{b}</strong>
          </div>
          <input
            className="workbench-slider"
            type="range"
            min="0"
            max="100"
            value={b}
            onChange={(event) => {
              setProfile("custom");
              setB(Number(event.target.value));
            }}
          />
        </label>

        <div className="workbench-toggle-row">
          <div className="metric-row">
            <span>{experiment.controls.flag}</span>
            <strong>{flag ? "enabled" : "disabled"}</strong>
          </div>
          <button
            className={flag ? "chip active" : "chip"}
            onClick={() => {
              setProfile("custom");
              setFlag((previous) => !previous);
            }}
            type="button"
          >
            toggle
          </button>
        </div>
      </div>

      {output.visual}

      <div className="workbench-signal-list">
        {experiment.signals.map((signal) => (
          <article className="workbench-signal-card" key={signal}>
            <p>{signal}</p>
          </article>
        ))}
      </div>

      <div className="workbench-metrics">
        {output.metrics.map((metric) => (
          <div className="metric-row" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </div>
        ))}
      </div>

      <p className="sim-reco">{output.recommendation}</p>
      <p className="muted">Tools: {experiment.tools.join(", ")}</p>
    </article>
  );
}
