import { Link } from "react-router-dom";
import workItems from "../content/work.json";
import type { WorkItem } from "../types/content";
import { usePageMeta } from "../lib/seo";

const typedWorkItems = workItems as WorkItem[];

function scoreWork(item: WorkItem): number {
  const tradeoffDepth = item.tradeoffs.length * 8;
  const checkpointDepth = item.checkpoints.length * 12;
  const postmortemDepth = item.postmortem.length * 10;
  const proofDepth = (item.proofStats?.length ?? 0) * 10;
  return tradeoffDepth + checkpointDepth + postmortemDepth + proofDepth;
}

export function WorkIndexPage() {
  usePageMeta({
    title: "Work Systems | Catalin Siegling",
    description:
      "Sanitized project breakdowns with real tradeoffs, failure points, and what I learned while shipping.",
    path: "/work"
  });

  return (
    <div className="stack">
      <section className="surface">
        <p className="eyebrow">Work Systems</p>
        <h1>Primary: production bot. Secondary: Trek Field Guide.</h1>
        <p>
          I cut weaker filler work. This section now reflects what I actually built and maintained over the last year.
        </p>
      </section>

      <section className="card-grid work-index-grid">
        {typedWorkItems.map((item) => (
          <article className="card work-index-card" key={item.slug}>
            <p className="tag">Depth score {scoreWork(item)}</p>
            <h2>{item.title}</h2>
            <p>{item.summary ?? item.context}</p>
            <p className="muted">
              {item.checkpoints.length} checkpoints · {item.tradeoffs.length} tradeoffs · {item.postmortem.length} postmortem
              notes
            </p>
            {item.proofStats?.length ? (
              <p className="muted">
                {item.proofStats.slice(0, 2).map((stat) => `${stat.value} ${stat.label.toLowerCase()}`).join(" · ")}
              </p>
            ) : null}
            <div className="button-row">
              <Link className="inline-link" to={`/work/${item.slug}`}>
                open system
              </Link>
              {item.liveUrl && (
                <a className="inline-link" href={item.liveUrl} target="_blank" rel="noreferrer">
                  live deploy
                </a>
              )}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
