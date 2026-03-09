import { useEffect, useMemo, useState } from "react";
import type { Experiment } from "../../types/content";
import { clamp } from "../../lib/math";

type ExperimentWorkbenchProps = {
  experiment: Experiment | null;
};

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

  const nudgeA = (delta: number) => {
    setProfile("custom");
    setA((prev) => clamp(prev + delta, 0, 100));
  };

  const nudgeB = (delta: number) => {
    setProfile("custom");
    setB((prev) => clamp(prev + delta, 0, 100));
  };

  const toggleFlag = () => {
    setProfile("custom");
    setFlag((prev) => !prev);
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
        metrics: [] as Array<{ label: string; value: string }>
      };
    }

    switch (experiment.id) {
      case "retry-backoff-tuner": {
        const retries = Math.round(clamp(a / 18, 1, 6));
        const baseDelay = Math.round(clamp(b * 22, 120, 2200));
        const totalWait = Math.round(baseDelay * (Math.pow(2, retries) - 1));
        const burstRisk = clamp(78 - retries * 6 - baseDelay / 120 + (flag ? -9 : 11), 2, 99);
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
          ]
        };
      }
      case "cache-ttl-ladder": {
        const ttl = Math.round(clamp(a * 2.2, 15, 220));
        const traffic = Math.round(clamp(b, 5, 100));
        const freshness = clamp(92 - ttl * 0.22 - traffic * 0.15 + (flag ? 9 : -7), 2, 99);
        const apiLoad = clamp(18 + traffic * 0.7 - ttl * 0.25 + (flag ? 8 : -3), 1, 99);
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
          ]
        };
      }
      case "scheduler-heartbeat-view": {
        const heartbeatAge = Math.round(clamp(a * 12, 30, 1200));
        const staleThreshold = Math.round(clamp(b * 14, 45, 1400));
        const stale = heartbeatAge > staleThreshold || !flag;
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
          ]
        };
      }
      case "queue-burst-sim": {
        const incoming = Math.round(clamp(a * 2.2, 10, 220));
        const throughput = Math.round(clamp(b * 2.1, 10, 210));
        const backlogDelta = incoming - throughput + (flag ? -8 : 7);
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
          ]
        };
      }
      case "event-fingerprint-audit": {
        const strictness = Math.round(clamp(a, 0, 100));
        const payloadVariance = Math.round(clamp(b, 0, 100));
        const duplicateRate = clamp(74 - strictness * 0.6 + payloadVariance * 0.32, 1, 90);
        const missRate = clamp(5 + strictness * 0.42 + (flag ? -3 : 8), 0, 70);
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
          ]
        };
      }
      case "dashboard-auth-flow": {
        const sessionTtl = Math.round(clamp(a * 0.9, 15, 90));
        const attemptRate = Math.round(clamp(b, 0, 100));
        const abuseRisk = clamp(14 + attemptRate * 0.55 - sessionTtl * 0.22 + (flag ? -10 : 12), 1, 99);
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
          ]
        };
      }
      default:
        return {
          title: experiment.title,
          recommendation: experiment.result,
          metrics: [
            { label: "State A", value: `${a}` },
            { label: "State B", value: `${b}` },
            { label: "Feature flag", value: flag ? "on" : "off" }
          ]
        };
    }
  }, [a, b, flag, experiment]);

  if (!experiment) {
    return (
      <article className="card playground-workbench">
        <h3>Select an experiment</h3>
      </article>
    );
  }

  const stagePulse = clamp(Math.round((a + b + (flag ? -8 : 12)) / 2), 0, 100);
  const stagePressure = clamp(Math.round((b * 0.7 + (flag ? -10 : 18))), 0, 100);
  const stageStability = clamp(Math.round(100 - Math.abs(a - b) - (flag ? 8 : 24)), 0, 100);

  return (
    <article key={experiment.id} className="card playground-workbench panel-enter">
      <p className="tag">{experiment.category} experiment</p>
      <h3>{output.title}</h3>
      <p>{experiment.summary}</p>

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
        <div className="metric-row">
          <span>Control A</span>
          <strong>{a}</strong>
        </div>
        <div className="button-row compact">
          <button className="chip" onClick={() => nudgeA(-12)} type="button">
            A -12
          </button>
          <button className="chip" onClick={() => nudgeA(12)} type="button">
            A +12
          </button>
        </div>

        <div className="metric-row">
          <span>Control B</span>
          <strong>{b}</strong>
        </div>
        <div className="button-row compact">
          <button className="chip" onClick={() => nudgeB(-12)} type="button">
            B -12
          </button>
          <button className="chip" onClick={() => nudgeB(12)} type="button">
            B +12
          </button>
        </div>

        <div className="metric-row">
          <span>Feature toggle</span>
          <strong>{flag ? "enabled" : "disabled"}</strong>
        </div>
        <div className="button-row compact">
          <button className={flag ? "chip active" : "chip"} onClick={toggleFlag} type="button">
            toggle feature
          </button>
        </div>
      </div>

      <div className="workbench-stage" aria-label="Live workbench signal stage">
        <div className="stage-metric">
          <span>pulse</span>
          <div className="meter">
            <div className="fill good" style={{ width: `${stagePulse}%` }} />
          </div>
        </div>
        <div className="stage-metric">
          <span>pressure</span>
          <div className="meter">
            <div className="fill warn" style={{ width: `${stagePressure}%` }} />
          </div>
        </div>
        <div className="stage-metric">
          <span>stability</span>
          <div className="meter">
            <div className="fill bad" style={{ width: `${stageStability}%` }} />
          </div>
        </div>
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
      <p>{experiment.result}</p>
    </article>
  );
}
