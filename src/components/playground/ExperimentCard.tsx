import type { Experiment } from "../../types/content";
import { playgroundCategoryLabels, playgroundStatusLabels } from "../../lib/playground";

type ExperimentCardProps = {
  experiment: Experiment;
  active: boolean;
  onSelect: (experiment: Experiment) => void;
};

export function ExperimentCard({ experiment, active, onSelect }: ExperimentCardProps) {
  const primarySignal = experiment.signals[0];

  return (
    <article className={active ? "card experiment-select-card active" : "card experiment-select-card"}>
      <div className="experiment-card-head">
        <p className="tag">{playgroundCategoryLabels[experiment.category]}</p>
        <span className={`playground-status-pill playground-status-pill-${experiment.status}`}>
          {playgroundStatusLabels[experiment.status]}
        </span>
      </div>
      <h3>{experiment.title}</h3>
      <p className="experiment-card-summary">{experiment.summary}</p>
      <div className="experiment-card-block">
        <span>question</span>
        <p>{experiment.question}</p>
      </div>
      <div className="experiment-card-block">
        <span>why it earned a spot</span>
        <p>{experiment.result}</p>
      </div>
      <p className="muted experiment-card-meta">Applied to {experiment.appliedTo}</p>
      {primarySignal ? <p className="muted experiment-card-tools">First signal: {primarySignal}</p> : null}
      <button
        className="inline-link button-link experiment-open-link"
        type="button"
        onClick={() => onSelect(experiment)}
        aria-pressed={active}
        aria-label={active ? `${experiment.title} is open in the lab` : `Open ${experiment.title} in the lab`}
      >
        {active ? "in the lab" : "open in lab"}
      </button>
    </article>
  );
}
