import { useMemo, useState } from "react";
import type { WorkCheckpoint } from "../../types/content";

type WorkJourneyRailProps = {
  checkpoints: WorkCheckpoint[];
};

export function WorkJourneyRail({ checkpoints }: WorkJourneyRailProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const activeCheckpoint = useMemo(() => checkpoints[activeIndex] ?? checkpoints[0], [activeIndex, checkpoints]);

  if (!activeCheckpoint) {
    return null;
  }

  return (
    <section className="surface">
      <p className="eyebrow">Journey Rail</p>
      <h2>How I iterated this project over time</h2>
      <div className="journey-rail-grid">
        <aside className="journey-rail-nav">
          {checkpoints.map((checkpoint, index) => (
            <button
              key={checkpoint.stage}
              className={index === activeIndex ? "chip active" : "chip"}
              onClick={() => setActiveIndex(index)}
              type="button"
            >
              {checkpoint.stage}
            </button>
          ))}
        </aside>
        <article className="card journey-stage-card">
          <p className="tag">{activeCheckpoint.stage}</p>
          <h3>What I shipped</h3>
          <p>{activeCheckpoint.move}</p>
          <h3>What happened after</h3>
          <p>{activeCheckpoint.signal}</p>
        </article>
      </div>
    </section>
  );
}
