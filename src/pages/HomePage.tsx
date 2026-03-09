import { Suspense, lazy } from "react";
import { Link } from "react-router-dom";
import { HeroStatement } from "../components/home/HeroStatement";
import { LiveBotFeed } from "../components/home/LiveBotFeed";
import workItems from "../content/work.json";
import type { WorkItem } from "../types/content";
import { usePageMeta } from "../lib/seo";

const featuredWork = (workItems as WorkItem[]).filter((item) => item.featured).slice(0, 2);

const BotOperatorBriefing = lazy(() =>
  import("../components/home/BotOperatorBriefing").then((module) => ({ default: module.BotOperatorBriefing }))
);
const FeaturedExperiments = lazy(() =>
  import("../components/home/FeaturedExperiments").then((module) => ({ default: module.FeaturedExperiments }))
);

function SectionFallback({ label }: Readonly<{ label: string }>) {
  return (
    <section className="surface loading-surface">
      <p className="eyebrow">Loading</p>
      <h2>{label}</h2>
    </section>
  );
}

export function HomePage() {
  usePageMeta({
    title: "Catalin Siegling | Production Bot Engineer",
    description:
      "Portfolio built around a year of production bot work: live system, real incidents, architecture, and reliability fixes.",
    path: "/"
  });

  return (
    <div className="stack home-stack">
      <HeroStatement />
      <LiveBotFeed />
      <Suspense fallback={<SectionFallback label="Loading operator briefing..." />}>
        <BotOperatorBriefing />
      </Suspense>
      <Suspense fallback={<SectionFallback label="Loading technical decisions..." />}>
        <FeaturedExperiments />
      </Suspense>
      <section className="surface home-work-section">
        <div className="split-header">
          <div>
            <p className="eyebrow">The Work</p>
            <h2>The bot in full detail, plus a secondary UI project.</h2>
          </div>
        </div>
        <div className="card-grid">
          {featuredWork.map((item) => (
            <article key={item.slug} className="card">
              <h3>{item.title}</h3>
              <p>{item.summary ?? item.context}</p>
              {item.stack && <p className="muted">Stack: {item.stack.join(", ")}</p>}
              {item.proofStats?.length ? (
                <p className="muted">
                  {item.proofStats.slice(0, 3).map((stat) => `${stat.value} ${stat.label.toLowerCase()}`).join(" · ")}
                </p>
              ) : null}
              <Link className="inline-link" to={`/work/${item.slug}`}>
                Open full breakdown
              </Link>
              {item.liveUrl && (
                <a className="inline-link" href={item.liveUrl} target="_blank" rel="noreferrer">
                  View live project
                </a>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
