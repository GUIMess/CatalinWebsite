import type { Experiment } from "../../types/content";

type ExperimentDrawerProps = {
  experiment: Experiment | null;
  onClose: () => void;
};

export function ExperimentDrawer({ experiment, onClose }: ExperimentDrawerProps) {
  if (!experiment) {
    return null;
  }

  return (
    <aside className="surface drawer">
      <div className="split-header">
        <div>
          <p className="eyebrow">Experiment Notes</p>
          <h3>{experiment.title}</h3>
        </div>
        <button className="chip" type="button" onClick={onClose}>
          Close
        </button>
      </div>
      <p>{experiment.result}</p>
      <p className="muted">Tools: {experiment.tools.join(", ")}</p>
    </aside>
  );
}

