import { useMemo, useState } from "react";
import experiments from "../content/experiments.json";
import type { Experiment } from "../types/content";
import { ExperimentFilterBar } from "../components/playground/ExperimentFilterBar";
import { ExperimentCard } from "../components/playground/ExperimentCard";
import { ExperimentWorkbench } from "../components/playground/ExperimentWorkbench";
import { usePageMeta } from "../lib/seo";

const typedExperiments = experiments as Experiment[];

export function PlaygroundPage() {
  usePageMeta({
    title: "Playground | Catalin Siegling",
    description:
      "Micro-interactions and interface experiments shipped in public to test product feel and decision quality.",
    path: "/playground"
  });

  const [activeCategory, setActiveCategory] = useState<Experiment["category"] | "all">("all");
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null);

  const filtered = useMemo(() => {
    if (activeCategory === "all") {
      return typedExperiments;
    }
    return typedExperiments.filter((item) => item.category === activeCategory);
  }, [activeCategory]);

  const activeExperiment = useMemo(() => {
    if (!filtered.length) {
      return null;
    }
    if (!selectedExperiment) {
      return filtered[0];
    }
    return filtered.find((item) => item.id === selectedExperiment.id) ?? filtered[0];
  }, [filtered, selectedExperiment]);

  return (
    <div className="stack">
      <section className="surface">
        <p className="eyebrow">Playground</p>
        <h1>Interactive experiment workbench</h1>
        <p>
          Pick an experiment and manipulate controls in the same box. No scrolling to a bottom drawer.
        </p>
        <ExperimentFilterBar active={activeCategory} onSelect={setActiveCategory} />
      </section>
      <section className="playground-grid">
        <div className="experiment-list">
          {filtered.map((item) => (
            <ExperimentCard
              key={item.id}
              experiment={item}
              active={activeExperiment?.id === item.id}
              onSelect={setSelectedExperiment}
            />
          ))}
        </div>
        <ExperimentWorkbench experiment={activeExperiment} />
      </section>
    </div>
  );
}
