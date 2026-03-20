import type { Experiment } from "../../types/content";
import { playgroundCategoryLabels } from "../../lib/playground";

type ExperimentFilterBarProps = {
  active: Experiment["category"] | "all";
  categories: Experiment["category"][];
  onSelect: (category: Experiment["category"] | "all") => void;
};

export function ExperimentFilterBar({ active, categories, onSelect }: ExperimentFilterBarProps) {
  return (
    <div className="button-row" role="group" aria-label="Filter experiments by category">
      <button
        className={active === "all" ? "chip active" : "chip"}
        type="button"
        onClick={() => onSelect("all")}
        aria-pressed={active === "all"}
      >
        all labs
      </button>
      {categories.map((category) => (
        <button
          key={category}
          className={active === category ? "chip active" : "chip"}
          type="button"
          onClick={() => onSelect(category)}
          aria-pressed={active === category}
        >
          {playgroundCategoryLabels[category]}
        </button>
      ))}
    </div>
  );
}
