import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import workItems from "../content/work.json";
import type { WorkItem } from "../types/content";
import { LiveDemoFrame } from "../components/work/LiveDemoFrame";
import { TradeoffPanel } from "../components/work/TradeoffPanel";
import { PostmortemNotes } from "../components/work/PostmortemNotes";
import { WorkJourneyRail } from "../components/work/WorkJourneyRail";
import { WorkProofPanel } from "../components/work/WorkProofPanel";
import { NotFoundState } from "../components/routing/NotFoundState";
import { usePageMeta } from "../lib/seo";

const typedWorkItems = workItems as WorkItem[];

export function WorkPage() {
  const { slug } = useParams();
  const [mode, setMode] = useState<"stress" | "steady">("steady");

  const activeWork = useMemo(() => {
    return typedWorkItems.find((item) => item.slug === slug);
  }, [slug]);

  usePageMeta({
    title: activeWork ? `${activeWork.title} | Catalin Siegling` : "Project Not Found | Catalin Siegling",
    description: activeWork
      ? activeWork.summary ??
        "System view focused on tradeoffs, runtime states, and what changed under real use."
      : "The project link you opened is no longer active on this site.",
    path: activeWork ? `/work/${activeWork.slug}` : "/work",
    robots: activeWork ? "index,follow" : "noindex,nofollow"
  });

  if (!activeWork) {
    return (
      <div className="stack">
        <NotFoundState
          eyebrow="Missing Project"
          title="Project not found"
          description="That project is not active anymore or the link is wrong. Use the work index to open a live project."
          backTo="/work"
          backLabel="Back to all systems"
        />
      </div>
    );
  }

  return (
    <div className="stack">
      <section className="surface page-intro work-page-hero">
        <p className="eyebrow">System View</p>
        <h1>{activeWork.title}</h1>
        <p>{activeWork.summary ?? activeWork.context}</p>
        <p className="muted">{activeWork.context}</p>
        {activeWork.stack && <p className="muted">Stack: {activeWork.stack.join(", ")}</p>}
        <div className="button-row">
          <Link className="inline-link" to="/work">
            Back to all systems
          </Link>
          {activeWork.liveUrl && (
            <a className="inline-link" href={activeWork.liveUrl} target="_blank" rel="noreferrer">
              Visit live build
            </a>
          )}
        </div>
      </section>
      <LiveDemoFrame
        title={activeWork.title}
        hook={activeWork.demoHook}
        mode={mode}
        onModeChange={setMode}
        panels={activeWork.runtimePanels}
      />
      <WorkProofPanel work={activeWork} />
      <WorkJourneyRail checkpoints={activeWork.checkpoints} />
      <TradeoffPanel tradeoffs={activeWork.tradeoffs} />
      <PostmortemNotes notes={activeWork.postmortem} />
    </div>
  );
}
