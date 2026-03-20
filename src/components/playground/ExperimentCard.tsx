import type { Experiment } from "../../types/content";

type ExperimentCardProps = {
  experiment: Experiment;
  active: boolean;
  onSelect: (experiment: Experiment) => void;
};

export function ExperimentCard({ experiment, active, onSelect }: ExperimentCardProps) {
  return (
    <article className={active ? "card experiment-select-card active" : "card experiment-select-card"}>
      <div className="experiment-card-head">
        <p className="tag">{experiment.category}</p>
        <span className={`playground-status-pill playground-status-pill-${experiment.status}`}>{experiment.status}</span>
      </div>
      <h3>{experiment.title}</h3>
      <p>{experiment.summary}</p>
      <p className="muted experiment-card-question">{experiment.question}</p>
      <p className="muted experiment-card-meta">Applied to {experiment.appliedTo}</p>
      <p className="muted experiment-card-tools">{experiment.tools.join(" / ")}</p>
      <button
        className="inline-link button-link"
        type="button"
        onClick={() => onSelect(experiment)}
        aria-pressed={active}
        aria-label={active ? `${experiment.title} is loaded` : `Load ${experiment.title}`}
      >
        {active ? "loaded" : "load experiment"}
      </button>
    </article>
  );
}
