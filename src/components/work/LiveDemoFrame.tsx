import type { RuntimePanel } from "../../types/content";

type LiveDemoFrameProps = {
  title: string;
  hook: string;
  mode: "stress" | "steady";
  onModeChange: (mode: "stress" | "steady") => void;
  panels?: RuntimePanel[];
};

const fallbackPanels: RuntimePanel[] = [
  {
    title: "Decision Queue",
    broken: "11 unprioritized items with no clear owner.",
    fixed: "4 ranked actions with clear ownership and deadlines."
  },
  {
    title: "Conversion Pressure",
    broken: "Verification drop spikes to 38%, no recovery path shown.",
    fixed: "Drop reduced to 16% with inline recovery and retry UI."
  },
  {
    title: "Reliability",
    broken: "Latency bursts without state cues trigger repeated user actions.",
    fixed: "Latency cues are explicit, reducing duplicate submissions."
  }
];

export function LiveDemoFrame({ title, hook, mode, onModeChange, panels }: LiveDemoFrameProps) {
  const stressed = mode === "stress";
  const activePanels = panels?.length ? panels.slice(0, 3) : fallbackPanels;

  return (
    <section className="surface runtime-frame-surface">
      <div className="split-header">
        <div>
          <p className="eyebrow">Pressure Test</p>
          <h2>{title}</h2>
          <p>{hook}</p>
        </div>
        <div className="runtime-frame-controls">
          <span className={stressed ? "runtime-state-pill runtime-state-pill-danger" : "runtime-state-pill"}>
            {stressed ? "stress path" : "steady path"}
          </span>
          <div className="button-row runtime-toggle-row">
            <button
              className={mode === "steady" ? "chip active" : "chip"}
              onClick={() => onModeChange("steady")}
              type="button"
            >
              steady
            </button>
            <button
              className={mode === "stress" ? "chip active danger" : "chip"}
              onClick={() => onModeChange("stress")}
              type="button"
            >
              stress
            </button>
          </div>
        </div>
      </div>
      <div className={`demo-frame ${stressed ? "break" : "fix"}`}>
        <div className="demo-header">
          <span>System slice</span>
          <strong>{stressed ? "Under pressure" : "Holding steady"}</strong>
        </div>
        <div className="demo-grid">
          {activePanels.map((panel) => (
            <article key={panel.title} className="runtime-panel-card">
              <p className="tag">{stressed ? "stress" : "steady"}</p>
              <h4>{panel.title}</h4>
              <p>{stressed ? panel.broken : panel.fixed}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
