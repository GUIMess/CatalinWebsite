import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import experiments from "../content/experiments.json";
import type { Experiment } from "../types/content";
import { ExperimentFilterBar } from "../components/playground/ExperimentFilterBar";
import { ExperimentCard } from "../components/playground/ExperimentCard";
import { ExperimentWorkbench } from "../components/playground/ExperimentWorkbench";
import { usePageMeta } from "../lib/seo";

const typedExperiments = experiments as Experiment[];
const categoryOrder: Experiment["category"][] = ["ai-flow", "ui", "motion", "3d"];

export function PlaygroundPage() {
  usePageMeta({
    title: "Playground | Catalin Siegling",
    description:
      "Smaller experiments used to test interaction feel, operational tradeoffs, and interface direction.",
    path: "/playground"
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get("category");
  const initialExperiment = searchParams.get("experiment");
  const [activeCategory, setActiveCategory] = useState<Experiment["category"] | "all">(() => {
    if (initialCategory === "motion" || initialCategory === "ui" || initialCategory === "ai-flow" || initialCategory === "3d") {
      return initialCategory;
    }
    return "all";
  });
  const [selectedExperimentId, setSelectedExperimentId] = useState<string | null>(() => initialExperiment);
  const availableCategories = useMemo(() => {
    return categoryOrder.filter((category) => typedExperiments.some((item) => item.category === category));
  }, []);

  const filtered = useMemo(() => {
    const scoped = activeCategory === "all"
      ? typedExperiments
      : typedExperiments.filter((item) => item.category === activeCategory);

    return scoped.slice().sort((left, right) => {
      const featuredWeight = Number(Boolean(right.featured)) - Number(Boolean(left.featured));
      if (featuredWeight !== 0) {
        return featuredWeight;
      }
      return left.title.localeCompare(right.title);
    });
  }, [activeCategory]);

  const overview = useMemo(() => {
    const shipped = typedExperiments.filter((item) => item.status === "shipped").length;
    const exploratory = typedExperiments.filter((item) => item.status === "exploratory").length;
    const featured = typedExperiments.filter((item) => item.featured).length;

    return [
      { label: "experiments", value: `${typedExperiments.length}`, detail: "small sandboxes on this page" },
      { label: "shipped", value: `${shipped}`, detail: "ideas that graduated into production" },
      { label: "featured", value: `${featured}`, detail: "the ones worth opening first" },
      { label: "visible now", value: `${activeCategory === "all" ? typedExperiments.length : filtered.length}`, detail: activeCategory === "all" ? "full shelf loaded" : `${activeCategory} filter active` },
      { label: "exploratory", value: `${exploratory}`, detail: "worth learning from even if they stayed out" }
    ];
  }, [activeCategory, filtered.length]);

  const graduatedExperiments = useMemo(() => {
    return typedExperiments.filter((item) => item.status === "shipped").slice(0, 4);
  }, []);

  const activeExperiment = useMemo(() => {
    if (!filtered.length) {
      return null;
    }
    if (!selectedExperimentId) {
      return filtered[0];
    }
    return filtered.find((item) => item.id === selectedExperimentId) ?? filtered[0];
  }, [filtered, selectedExperimentId]);

  useEffect(() => {
    const next = new URLSearchParams();
    if (activeCategory !== "all") {
      next.set("category", activeCategory);
    }
    if (activeExperiment?.id) {
      next.set("experiment", activeExperiment.id);
    }
    setSearchParams(next, { replace: true });
  }, [activeCategory, activeExperiment?.id, setSearchParams]);

  return (
    <div className="stack">
      <section className="surface page-intro">
        <p className="eyebrow">Playground</p>
        <h1>Smaller tests behind the bigger system.</h1>
        <p>
          This is where I isolate one variable at a time before it shows up in the main product.
        </p>
        <ExperimentFilterBar active={activeCategory} categories={availableCategories} onSelect={setActiveCategory} />
      </section>
      <section className="surface playground-overview-shell">
        <div className="playground-overview-grid">
          {overview.map((item) => (
            <article className="card playground-overview-card" key={item.label}>
              <p className="tag">{item.label}</p>
              <h2>{item.value}</h2>
              <p className="muted">{item.detail}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="surface playground-shell">
        <div className="split-header">
          <div>
            <p className="eyebrow">Experiment Shelf</p>
            <h2>Single-variable tests, kept in the same visual language as the shipped work.</h2>
          </div>
          {activeExperiment ? (
            <span className={`playground-status-pill playground-status-pill-${activeExperiment.status}`}>
              {activeExperiment.status}
            </span>
          ) : null}
        </div>
        {activeExperiment ? (
          <div className="playground-focus-grid">
            <article className="card playground-focus-card">
              <p className="tag">Current Question</p>
              <h3>{activeExperiment.title}</h3>
              <p>{activeExperiment.question}</p>
              <p className="muted">Applied to {activeExperiment.appliedTo}</p>
            </article>
            <article className="card playground-focus-card">
              <p className="tag">What I watched</p>
              <ul className="notes-list playground-signal-list">
                {activeExperiment.signals.map((signal) => (
                  <li key={signal}>{signal}</li>
                ))}
              </ul>
            </article>
          </div>
        ) : null}
        <div className="playground-grid">
          <div className="experiment-list">
            {filtered.map((item) => (
              <ExperimentCard
                key={item.id}
                experiment={item}
                active={activeExperiment?.id === item.id}
                onSelect={(experiment) => setSelectedExperimentId(experiment.id)}
              />
            ))}
          </div>
          <ExperimentWorkbench experiment={activeExperiment} />
        </div>
      </section>
      <section className="surface playground-carryover-shell">
        <div className="split-header">
          <div>
            <p className="eyebrow">Graduated Work</p>
            <h2>Ideas that earned their way into the real system.</h2>
          </div>
        </div>
        <div className="card-grid playground-carryover-grid">
          {graduatedExperiments.map((item) => (
            <article className="card playground-carryover-card" key={item.id}>
              <p className="tag">{item.category}</p>
              <h3>{item.title}</h3>
              <p>{item.result}</p>
              <p className="muted">Applied to {item.appliedTo}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
