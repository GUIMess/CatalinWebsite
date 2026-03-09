import type { Experiment } from "../../types/content";

type ExperimentCardProps = {
  experiment: Experiment;
  active: boolean;
  onSelect: (experiment: Experiment) => void;
};

export function ExperimentCard({ experiment, active, onSelect }: ExperimentCardProps) {
  return (
    <article className={active ? "card experiment-select-card active" : "card experiment-select-card"}>
      <p className="tag">{experiment.category}</p>
      <h3>{experiment.title}</h3>
      <p>{experiment.summary}</p>
      <button className="inline-link button-link" type="button" onClick={() => onSelect(experiment)}>
        {active ? "in workbench" : "open in workbench"}
      </button>
    </article>
  );
}
