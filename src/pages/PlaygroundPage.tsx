import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import experiments from "../content/experiments.json";
import type { Experiment } from "../types/content";
import { ExperimentFilterBar } from "../components/playground/ExperimentFilterBar";
import { ExperimentCard } from "../components/playground/ExperimentCard";
import { ExperimentWorkbench } from "../components/playground/ExperimentWorkbench";
import { usePageMeta } from "../lib/seo";
import { playgroundStatusLabels } from "../lib/playground";

const typedExperiments = experiments as Experiment[];
const categoryOrder: Experiment["category"][] = ["ai-flow", "ui", "motion", "3d"];
const labRules = [
  "Pick one annoying product problem, not a buzzword.",
  "Push the controls until the read changes, then pull it back to something you would trust.",
  "If the lesson is not useful in production, the experiment failed."
];

export function PlaygroundPage() {
  usePageMeta({
    title: "Playground | Catalin Siegling",
    description:
      "Small interactive labs used to test one real product problem at a time, including what shipped and what got cut.",
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

  const shippedExperiments = useMemo(() => {
    return typedExperiments.filter((item) => item.status === "shipped").slice(0, 4);
  }, []);
  const exploratoryExperiments = useMemo(() => {
    return typedExperiments.filter((item) => item.status === "exploratory");
  }, []);
  const activeExperiments = useMemo(() => {
    return typedExperiments.filter((item) => item.status === "active");
  }, []);
  const statusCounts = useMemo(() => {
    return {
      shipped: typedExperiments.filter((item) => item.status === "shipped").length,
      active: typedExperiments.filter((item) => item.status === "active").length,
      exploratory: typedExperiments.filter((item) => item.status === "exploratory").length
    };
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
      <section className="surface page-intro playground-hero">
        <div className="playground-hero-layout">
          <div className="playground-hero-copy">
            <p className="eyebrow">Playground</p>
            <h1>This page has to earn your time.</h1>
            <p>
              These are small labs for real product questions. If an experiment only looks clever, it does not belong
              here.
            </p>
            <p className="muted">
              Pick a problem, break it on purpose, then pull it back to something you would actually trust.
            </p>
            <ExperimentFilterBar active={activeCategory} categories={availableCategories} onSelect={setActiveCategory} />
            <div className="playground-proof-row" aria-label="Playground status">
              <span className="playground-proof-pill">{`${statusCounts.shipped} shipped`}</span>
              <span className="playground-proof-pill">{`${statusCounts.active} still tuning`}</span>
              <span className="playground-proof-pill">{`${statusCounts.exploratory} honest miss`}</span>
            </div>
          </div>

          <aside className="card playground-rules-card">
            <p className="tag">Ground Rules</p>
            <h2>Make the lesson obvious fast.</h2>
            <div className="playground-rule-list">
              {labRules.map((rule, index) => (
                <article className="playground-rule-item" key={rule}>
                  <span>{`0${index + 1}`}</span>
                  <p>{rule}</p>
                </article>
              ))}
            </div>
          </aside>
        </div>
      </section>
      <section className="surface playground-shell">
        <div className="split-header">
          <div>
            <p className="eyebrow">Pick A Problem</p>
            <h2>Each card is a tiny pressure test with a reason to exist.</h2>
            <p className="chapter-copy">
              The goal is not to admire widgets. The goal is to make one decision clearer.
            </p>
          </div>
          {activeExperiment ? (
            <span className={`playground-status-pill playground-status-pill-${activeExperiment.status}`}>
              {playgroundStatusLabels[activeExperiment.status]}
            </span>
          ) : null}
        </div>
        {activeExperiment ? (
          <div className="playground-brief-grid">
            <article className="card playground-brief-card">
              <p className="tag">Current Lab</p>
              <h3>{activeExperiment.title}</h3>
              <p>{activeExperiment.question}</p>
              <p className="muted">Applied to {activeExperiment.appliedTo}</p>
            </article>
            <article className="card playground-brief-card">
              <p className="tag">Why It Mattered</p>
              <p>{activeExperiment.result}</p>
              <p className="muted">{activeExperiment.summary}</p>
            </article>
            <article className="card playground-brief-card">
              <p className="tag">What Showed Up First</p>
              <ul className="notes-list playground-signal-list">
                {activeExperiment.signals.slice(0, 2).map((signal) => (
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
            <p className="eyebrow">What Survived</p>
            <h2>The useful bits shipped. The rest stayed in the lab.</h2>
            <p className="chapter-copy">
              That is the point of the playground: find the part worth stealing, then throw the rest away.
            </p>
          </div>
        </div>
        <div className="playground-carryover-layout">
          <div className="card-grid playground-carryover-grid">
            {shippedExperiments.map((item) => (
              <article className="card playground-carryover-card" key={item.id}>
                <p className="tag">{playgroundStatusLabels[item.status]}</p>
                <h3>{item.title}</h3>
                <p>{item.result}</p>
                <p className="muted">Applied to {item.appliedTo}</p>
              </article>
            ))}
          </div>

          {exploratoryExperiments[0] ? (
            <article className="card playground-cut-card">
              <p className="tag">The Honest Miss</p>
              <h3>{exploratoryExperiments[0].title}</h3>
              <p>{exploratoryExperiments[0].summary}</p>
              <p className="muted">{exploratoryExperiments[0].result}</p>
            </article>
          ) : null}
        </div>

        {activeExperiments.length ? (
          <div className="playground-active-strip">
            {activeExperiments.map((item) => (
              <article className="card playground-active-card" key={item.id}>
                <p className="tag">Still Tuning</p>
                <h3>{item.title}</h3>
                <p>{item.summary}</p>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
