import type { Experiment } from "../../types/content";

const categories: Experiment["category"][] = ["motion", "ui", "ai-flow", "3d"];

type ExperimentFilterBarProps = {
  active: Experiment["category"] | "all";
  onSelect: (category: Experiment["category"] | "all") => void;
};

export function ExperimentFilterBar({ active, onSelect }: ExperimentFilterBarProps) {
  return (
    <div className="button-row">
      <button
        className={active === "all" ? "chip active" : "chip"}
        type="button"
        onClick={() => onSelect("all")}
      >
        all
      </button>
      {categories.map((category) => (
        <button
          key={category}
          className={active === category ? "chip active" : "chip"}
          type="button"
          onClick={() => onSelect(category)}
        >
          {category}
        </button>
      ))}
    </div>
  );
}

