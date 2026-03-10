import { useMemo, useState } from "react";
import { clamp } from "../../lib/math";

type Severity = "info" | "warn" | "critical";
type Mode = "normal" | "degraded" | "manual";

type EventItem = {
  id: string;
  minute: string;
  message: string;
  severity: Severity;
};

type IncidentState = {
  primaryProviderUp: boolean;
  fallbackProviderUp: boolean;
  queueBacklog: number;
  dedupeHealthy: boolean;
  schedulerFresh: boolean;
  mode: Mode;
};

const initialState: IncidentState = {
  primaryProviderUp: true,
  fallbackProviderUp: true,
  queueBacklog: 24,
  dedupeHealthy: true,
  schedulerFresh: true,
  mode: "normal"
};

const initialEvents: EventItem[] = [
  { id: "e-1", minute: "00:02", message: "Boot checks passed. Polling loops are healthy.", severity: "info" },
  { id: "e-2", minute: "00:07", message: "Queue within expected range for current traffic.", severity: "info" }
];

function eventClass(severity: Severity): string {
  if (severity === "warn") return "event-row warn";
  if (severity === "critical") return "event-row critical";
  return "event-row";
}

function statusClass(active: boolean): string {
  return active ? "chip active" : "chip danger active";
}

export function IncidentSimulator() {
  const [state, setState] = useState<IncidentState>(initialState);
  const [events, setEvents] = useState<EventItem[]>(initialEvents);
  const [minuteCounter, setMinuteCounter] = useState(8);

  const metrics = useMemo(() => {
    const providerPenalty = state.primaryProviderUp ? 0 : 22;
    const fallbackPenalty = state.fallbackProviderUp ? 0 : 20;
    const dedupePenalty = state.dedupeHealthy ? 0 : 18;
    const schedulerPenalty = state.schedulerFresh ? 0 : 16;
    const modePenalty = state.mode === "manual" ? 22 : state.mode === "degraded" ? 8 : 0;

    const deliveryHealth = clamp(
      100 - providerPenalty - fallbackPenalty - dedupePenalty - schedulerPenalty - modePenalty - state.queueBacklog * 0.55,
      0,
      100
    );
    const delaySeconds = clamp(
      8 + state.queueBacklog * 1.9 + providerPenalty * 0.8 + (state.mode === "manual" ? 18 : 0),
      5,
      240
    );
    const dropRisk = clamp(
      3 + state.queueBacklog * 0.35 + fallbackPenalty * 0.6 + (state.schedulerFresh ? 0 : 11),
      0,
      100
    );
    const operatorLoad = clamp(
      18 + state.queueBacklog * 0.6 + providerPenalty * 0.7 + (state.mode === "manual" ? 20 : 0),
      0,
      100
    );

    return {
      deliveryHealth: Math.round(deliveryHealth),
      delaySeconds: Math.round(delaySeconds),
      dropRisk: Math.round(dropRisk),
      operatorLoad: Math.round(operatorLoad)
    };
  }, [state]);

  const pushEvent = (message: string, severity: Severity) => {
    const nextMinute = minuteCounter + 1;
    setMinuteCounter(nextMinute);
    const minuteText = `00:${String(nextMinute).padStart(2, "0")}`;

    setEvents((prev) => {
      const event: EventItem = {
        id: `${Date.now()}-${prev.length + 1}`,
        minute: minuteText,
        message,
        severity
      };
      return [event, ...prev].slice(0, 10);
    });
  };

  const simulateProviderOutage = () => {
    setState((prev) => ({
      ...prev,
      primaryProviderUp: false,
      mode: "degraded",
      queueBacklog: clamp(prev.queueBacklog + 18, 0, 100)
    }));
    pushEvent("Primary provider outage detected. Switched runtime to degraded mode.", "critical");
  };

  const simulateDuplicateStorm = () => {
    setState((prev) => ({
      ...prev,
      dedupeHealthy: false,
      queueBacklog: clamp(prev.queueBacklog + 14, 0, 100)
    }));
    pushEvent("Duplicate event storm detected. Fingerprint confidence dropped.", "warn");
  };

  const markSchedulerStale = () => {
    setState((prev) => ({
      ...prev,
      schedulerFresh: false,
      queueBacklog: clamp(prev.queueBacklog + 9, 0, 100)
    }));
    pushEvent("Scheduler heartbeat stale for one loop. Auto-restart pending.", "warn");
  };

  const runRecoveryPlaybook = () => {
    setState((prev) => ({
      ...prev,
      mode: "normal",
      queueBacklog: clamp(prev.queueBacklog - 22, 0, 100),
      dedupeHealthy: true,
      schedulerFresh: true,
      fallbackProviderUp: true
    }));
    pushEvent("Recovery playbook run: queue drained, dedupe restored, scheduler reset.", "info");
  };

  const restorePrimary = () => {
    setState((prev) => ({ ...prev, primaryProviderUp: true, mode: "normal" }));
    pushEvent("Primary provider back online. Runtime returned to normal mode.", "info");
  };

  const clearQueue = () => {
    setState((prev) => ({ ...prev, queueBacklog: clamp(prev.queueBacklog - 30, 0, 100) }));
    pushEvent("Manual queue drain completed.", "info");
  };

  return (
    <section className="surface">
      <p className="eyebrow">Break It / Recover It</p>
      <h2>Trigger a failure and see how the system holds together.</h2>
      <p>
        No postmortem essay first. Cause damage, run the recovery move, and watch delivery health, delay,
        and operator load change in real time.
      </p>

      <div className="button-row">
        <button className="chip danger" onClick={simulateProviderOutage} type="button">
          simulate provider outage
        </button>
        <button className="chip danger" onClick={simulateDuplicateStorm} type="button">
          trigger duplicate storm
        </button>
        <button className="chip danger" onClick={markSchedulerStale} type="button">
          mark scheduler stale
        </button>
        <button className="chip" onClick={runRecoveryPlaybook} type="button">
          run recovery playbook
        </button>
        <button className="chip" onClick={restorePrimary} type="button">
          restore primary
        </button>
        <button className="chip" onClick={clearQueue} type="button">
          clear queue
        </button>
      </div>

      <div className="button-row incident-status-row">
        <span className={statusClass(state.primaryProviderUp)}>primary {state.primaryProviderUp ? "up" : "down"}</span>
        <span className={statusClass(state.fallbackProviderUp)}>fallback {state.fallbackProviderUp ? "up" : "down"}</span>
        <span className={statusClass(state.dedupeHealthy)}>dedupe {state.dedupeHealthy ? "healthy" : "degraded"}</span>
        <span className={statusClass(state.schedulerFresh)}>scheduler {state.schedulerFresh ? "fresh" : "stale"}</span>
        <span className="chip active">mode {state.mode}</span>
      </div>

      <div className="incident-grid">
        <aside className="card incident-metrics">
          <h3>Incident Metrics</h3>

          <div className="metric-row">
            <span>Delivery health</span>
            <strong>{metrics.deliveryHealth}%</strong>
          </div>
          <div className="meter">
            <div className="fill good" style={{ width: `${metrics.deliveryHealth}%` }} />
          </div>

          <div className="metric-row">
            <span>Queue backlog</span>
            <strong>{state.queueBacklog}</strong>
          </div>
          <div className="meter">
            <div className="fill warn" style={{ width: `${state.queueBacklog}%` }} />
          </div>

          <div className="metric-row">
            <span>Estimated delay</span>
            <strong>{metrics.delaySeconds}s</strong>
          </div>
          <div className="meter">
            <div className="fill warn" style={{ width: `${Math.min(100, Math.round(metrics.delaySeconds / 2.4))}%` }} />
          </div>

          <div className="metric-row">
            <span>Drop risk</span>
            <strong>{metrics.dropRisk}%</strong>
          </div>
          <div className="meter">
            <div className="fill bad" style={{ width: `${metrics.dropRisk}%` }} />
          </div>

          <div className="metric-row">
            <span>Operator load</span>
            <strong>{metrics.operatorLoad}%</strong>
          </div>
          <div className="meter">
            <div className="fill warn" style={{ width: `${metrics.operatorLoad}%` }} />
          </div>
        </aside>

        <section className="card incident-log">
          <h3>Runbook Timeline</h3>
          <div className="event-list">
            {events.map((event) => (
              <article key={event.id} className={eventClass(event.severity)}>
                <span className="event-time">{event.minute}</span>
                <p className="event-message">{event.message}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
