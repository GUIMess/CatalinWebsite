import { Link } from "react-router-dom";
import workItems from "../content/work.json";
import type { WorkItem } from "../types/content";
import { usePageMeta } from "../lib/seo";

const typedWorkItems = workItems as WorkItem[];

export function WorkIndexPage() {
  usePageMeta({
    title: "Work Systems | Catalin Siegling",
    description:
      "A focused set of shipped systems with tradeoffs, failure points, and what changed over time.",
    path: "/work"
  });

  return (
    <div className="stack">
      <section className="surface page-intro work-index-hero">
        <p className="eyebrow">Selected Work</p>
        <h1>The flagship system.</h1>
      </section>

      <section className="surface work-index-shell">
        <div className="card-grid work-index-grid">
          {typedWorkItems.map((item) => (
            <article
              className={item.slug === "live-alert-bot-core" ? "card work-index-card work-index-card-flagship" : "card work-index-card"}
              key={item.slug}
            >
              <p className="tag">Flagship system</p>
              <h2>{item.title}</h2>
              <p>{item.summary ?? item.context}</p>
              <p className="muted">
                {item.checkpoints.length} checkpoints / {item.tradeoffs.length} tradeoffs / {item.postmortem.length} field notes
              </p>
              {item.proofStats?.length ? (
                <p className="muted">
                  {item.proofStats.slice(0, 2).map((stat) => `${stat.value} ${stat.label.toLowerCase()}`).join(" / ")}
                </p>
              ) : null}
              <div className="button-row">
                <Link className="inline-link" to={`/work/${item.slug}`}>
                  Open system view
                </Link>
                {item.liveUrl && (
                  <a className="inline-link" href={item.liveUrl} target="_blank" rel="noreferrer">
                    Visit live build
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
