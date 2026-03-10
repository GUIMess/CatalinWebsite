import { useMemo, useState } from "react";
import type { LogEntry } from "../../types/content";

type LogEntryListProps = {
  entries: LogEntry[];
};

const stageOrder: LogEntry["stage"][] = ["prototype", "ship", "iterate", "systems"];

function averageHours(entries: LogEntry[]): string {
  const withHours = entries.filter((entry) => typeof entry.hours === "number");
  if (!withHours.length) {
    return "n/a";
  }
  const sum = withHours.reduce((total, entry) => total + (entry.hours ?? 0), 0);
  return (sum / withHours.length).toFixed(1);
}

export function LogEntryList({ entries }: LogEntryListProps) {
  const [activeTheme, setActiveTheme] = useState<LogEntry["theme"] | "all">("all");
  const [activeStage, setActiveStage] = useState<LogEntry["stage"] | "all">("all");
  const [activeTool, setActiveTool] = useState<string>("all");

  const availableTools = useMemo(() => {
    return Array.from(new Set(entries.flatMap((entry) => entry.tools))).sort();
  }, [entries]);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const themeMatch = activeTheme === "all" || entry.theme === activeTheme;
      const stageMatch = activeStage === "all" || entry.stage === activeStage;
      const toolMatch = activeTool === "all" || entry.tools.includes(activeTool);
      return themeMatch && stageMatch && toolMatch;
    });
  }, [activeTheme, activeStage, activeTool, entries]);

  const totalHours = filteredEntries.reduce((sum, entry) => sum + (entry.hours ?? 0), 0);
  const uniqueToolCount = new Set(filteredEntries.flatMap((entry) => entry.tools)).size;

  return (
    <section className="surface">
      <div className="split-header">
        <div>
          <p className="eyebrow">Change Log</p>
          <h2>Filter the timeline by theme, stage, or tool.</h2>
        </div>
      </div>

      <div className="log-dashboard">
        <article className="card">
          <p className="tag">Filtered entries</p>
          <h3>{filteredEntries.length}</h3>
          <p className="muted">of {entries.length} total</p>
        </article>
        <article className="card">
          <p className="tag">Logged hours</p>
          <h3>{totalHours}</h3>
          <p className="muted">avg {averageHours(filteredEntries)} hours per update</p>
        </article>
        <article className="card">
          <p className="tag">Tool count</p>
          <h3>{uniqueToolCount}</h3>
          <p className="muted">distinct tools in this view</p>
        </article>
      </div>

      <div className="log-controls">
        <div className="button-row">
          <button className={activeTheme === "all" ? "chip active" : "chip"} onClick={() => setActiveTheme("all")} type="button">
            all themes
          </button>
          <button
            className={activeTheme === "product" ? "chip active" : "chip"}
            onClick={() => setActiveTheme("product")}
            type="button"
          >
            product
          </button>
          <button className={activeTheme === "ux" ? "chip active" : "chip"} onClick={() => setActiveTheme("ux")} type="button">
            ux
          </button>
          <button className={activeTheme === "ops" ? "chip active" : "chip"} onClick={() => setActiveTheme("ops")} type="button">
            ops
          </button>
          <button
            className={activeTheme === "growth" ? "chip active" : "chip"}
            onClick={() => setActiveTheme("growth")}
            type="button"
          >
            growth
          </button>
        </div>

        <div className="button-row">
          <button className={activeStage === "all" ? "chip active" : "chip"} onClick={() => setActiveStage("all")} type="button">
            all stages
          </button>
          {stageOrder.map((stage) => (
            <button
              key={stage}
              className={activeStage === stage ? "chip active" : "chip"}
              onClick={() => setActiveStage(stage)}
              type="button"
            >
              {stage}
            </button>
          ))}
        </div>

        <div className="button-row">
          <button className={activeTool === "all" ? "chip active" : "chip"} onClick={() => setActiveTool("all")} type="button">
            all tools
          </button>
          {availableTools.map((tool) => (
            <button
              key={tool}
              className={activeTool === tool ? "chip active" : "chip"}
              onClick={() => setActiveTool(tool)}
              type="button"
            >
              {tool}
            </button>
          ))}
        </div>
      </div>

      <div className="log-list">
        {filteredEntries.map((entry) => (
          <article key={entry.id} className="card log-card">
            <p className="tag">
              {entry.date} / {entry.stage} / {entry.theme}
            </p>
            <h3>{entry.build}</h3>
            <p>{entry.learned}</p>
            {entry.impact && <p className="muted">Impact: {entry.impact}</p>}
            <p className="muted">Tools: {entry.tools.join(", ")}</p>
            {entry.proofUrl && entry.proofLabel && (
              <div className="button-row">
                <a className="inline-link" href={entry.proofUrl} target="_blank" rel="noreferrer">
                  {entry.proofLabel}
                </a>
              </div>
            )}
          </article>
        ))}
      </div>
      {!filteredEntries.length && (
        <article className="card">
          <h3>No entries match these filters yet.</h3>
          <p className="muted">Try broadening the current filters.</p>
        </article>
      )}
    </section>
  );
}
