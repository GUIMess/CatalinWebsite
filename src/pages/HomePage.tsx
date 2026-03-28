import { Link } from "react-router-dom";
import { HeroStatement } from "../components/home/HeroStatement";
import { LiveBotFeed } from "../components/home/LiveBotFeed";
import workItems from "../content/work.json";
import evidence from "../content/evidence.json";
import type { WorkItem } from "../types/content";
import { usePageMeta } from "../lib/seo";

type EvidenceSnapshot = {
  incidentTimeline: Array<{
    id: string;
    date: string;
    category: string;
    title: string;
    summary: string;
    outcome: string;
    commits: Array<{
      hash: string;
      date: string;
      summary: string;
    }>;
  }>;
  recentOpsMoves: Array<{
    hash: string;
    date: string;
    summary: string;
    category: string;
  }>;
};

const typedWorkItems = workItems as WorkItem[];
const featuredWork = typedWorkItems.filter((item) => item.featured).slice(0, 2);
const snapshot = evidence as EvidenceSnapshot;
const incidentHighlights = snapshot.incidentTimeline.slice(0, 3);
const flagshipWork = featuredWork[0];
const flagshipPanels = flagshipWork?.runtimePanels?.slice(0, 3) ?? [];
const flagshipCheckpoints = flagshipWork?.checkpoints?.slice(0, 4) ?? [];

export function HomePage() {
  usePageMeta({
    title: "Catalin Siegling | Live Systems and Product Work",
    description:
      "A live systems portfolio centered on production bot work, recent fixes, and product experiments.",
    path: "/"
  });

  return (
    <div className="stack home-stack">
      <HeroStatement />
      <LiveBotFeed />
      <section className="surface home-work-section" id="system-builds">
        <div className="chapter-header">
          <div className="chapter-index-block">
            <span>02</span>
            <small>Build arc</small>
          </div>
          <div>
            <p className="eyebrow">Main Builds</p>
            <h2>The flagship system.</h2>
          </div>
          <Link className="inline-link" to="/playground">
            Open smaller experiments
          </Link>
        </div>
        <div className="home-build-grid">
          {flagshipWork ? (
            <article className="card build-flagship-card">
              <div className="build-card-head">
                <div>
                  <p className="tag">Flagship system</p>
                  <h3>{flagshipWork.title}</h3>
                </div>
                <Link className="inline-link" to={`/work/${flagshipWork.slug}`}>
                  Open system view
                </Link>
              </div>
              <p className="build-card-summary">{flagshipWork.summary ?? flagshipWork.context}</p>
              <div className="build-arc-timeline">
                {flagshipCheckpoints.map((checkpoint, index) => (
                  <article className="build-arc-step" key={checkpoint.stage}>
                    <span>{`0${index + 1}`}</span>
                    <strong>{checkpoint.stage}</strong>
                    <p>{checkpoint.move}</p>
                    <small>{checkpoint.signal}</small>
                  </article>
                ))}
              </div>
            </article>
          ) : null}

          <div className="home-build-side">
            {flagshipPanels.length ? (
              <article className="card build-panels-card">
                <p className="tag">Pressure points</p>
                <h3>Where the main system bends first.</h3>
                <div className="build-panel-list">
                  {flagshipPanels.map((panel) => (
                    <article className="build-panel-row" key={panel.title}>
                      <strong>{panel.title}</strong>
                      <p>{panel.fixed}</p>
                    </article>
                  ))}
                </div>
              </article>
            ) : null}
          </div>
        </div>
      </section>
      <section className="surface home-fix-section" id="recent-fixes">
        <div className="chapter-header">
          <div className="chapter-index-block">
            <span>03</span>
            <small>Recent fixes</small>
          </div>
          <div>
            <p className="eyebrow">Recent Fixes</p>
            <h2>Break / fix, in order.</h2>
          </div>
          <Link className="inline-link" to="/lab-log">
            Open full build feed
          </Link>
        </div>
        <div className="fix-rail">
          {incidentHighlights.map((item, index) => (
            <article className="card fix-step-card" key={item.id}>
              <div className="fix-step-top">
                <span>{`0${index + 1}`}</span>
                <p className="tag">
                  {item.date} / {item.category}
                </p>
              </div>
              <h3>{item.title}</h3>
              <p>{item.summary}</p>
              <p className="muted">{item.outcome}</p>
              {item.commits.length ? (
                <p className="fix-commit">
                  {item.commits[0].hash.slice(0, 8)} / {item.commits[0].summary}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
