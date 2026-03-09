import type { RuntimePanel } from "../../types/content";

type LiveDemoFrameProps = {
  title: string;
  hook: string;
  density: "compact" | "balanced" | "expanded";
  motionOn: boolean;
  mode: "break" | "fix";
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

export function LiveDemoFrame({ title, hook, density, motionOn, mode, panels }: LiveDemoFrameProps) {
  const broken = mode === "break";
  const activePanels = panels?.length ? panels.slice(0, 3) : fallbackPanels;

  return (
    <section className="surface">
      <p className="eyebrow">Runtime</p>
      <h2>{title}</h2>
      <p>{hook}</p>
      <div className={`demo-frame ${density} ${motionOn ? "motion-on" : "motion-off"} ${mode}`}>
        <div className="demo-header">
          <span>Scenario State</span>
          <strong>{broken ? "Broken Path" : "Fixed Path"}</strong>
        </div>
        <div className="demo-grid">
          {activePanels.map((panel) => (
            <article key={panel.title}>
              <h4>{panel.title}</h4>
              <p>{broken ? panel.broken : panel.fixed}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
