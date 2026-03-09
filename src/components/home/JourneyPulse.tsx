import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import logs from "../../content/logs.json";
import type { LogEntry } from "../../types/content";

const typedLogs = (logs as LogEntry[]).slice().sort((a, b) => b.date.localeCompare(a.date));

function stageLabel(entry: LogEntry): string {
  return `${entry.stage} · ${entry.theme}`;
}

export function JourneyPulse() {
  const [activeId, setActiveId] = useState<string>(typedLogs[0]?.id ?? "");
  const [windowSize, setWindowSize] = useState<3 | 8 | "all">(8);

  const visibleLogs = useMemo(() => {
    if (windowSize === "all") {
      return typedLogs;
    }
    return typedLogs.slice(0, windowSize);
  }, [windowSize]);

  const activeLog = useMemo(
    () => visibleLogs.find((entry) => entry.id === activeId) ?? visibleLogs[0],
    [activeId, visibleLogs]
  );

  return (
    <section className="surface journey-pulse">
      <div className="split-header">
        <div>
          <p className="eyebrow">Build Log</p>
          <h2>What I built, what broke, and what I learned — in order.</h2>
        </div>
        <Link className="inline-link" to="/lab-log">
          Open full log
        </Link>
      </div>

      <div className="button-row">
        <button className={windowSize === 3 ? "chip active" : "chip"} onClick={() => setWindowSize(3)} type="button">
          last 3 updates
        </button>
        <button className={windowSize === 8 ? "chip active" : "chip"} onClick={() => setWindowSize(8)} type="button">
          last 8 updates
        </button>
        <button className={windowSize === "all" ? "chip active" : "chip"} onClick={() => setWindowSize("all")} type="button">
          full timeline
        </button>
      </div>

      <div className="pulse-grid">
        <div className="pulse-track">
          {visibleLogs.map((entry) => (
            <button
              key={entry.id}
              className={entry.id === activeLog?.id ? "pulse-step active" : "pulse-step"}
              onClick={() => setActiveId(entry.id)}
              type="button"
            >
              <span className="event-time">{entry.date}</span>
              <span>{stageLabel(entry)}</span>
            </button>
          ))}
        </div>

        {activeLog && (
          <article className="card pulse-detail">
            <p className="tag">{stageLabel(activeLog)}</p>
            <h3>{activeLog.build}</h3>
            <p>{activeLog.learned}</p>
            {activeLog.impact && <p className="muted">Impact: {activeLog.impact}</p>}
            <p className="muted">Tools: {activeLog.tools.join(", ")}</p>
            <div className="button-row">
              <Link className="inline-link" to="/work">
                Open full breakdown
              </Link>
              <Link className="inline-link" to="/lab-log">
                Full build log
              </Link>
            </div>
          </article>
        )}
      </div>
    </section>
  );
}
