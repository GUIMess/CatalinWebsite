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
  const [density, setDensity] = useState<"compact" | "balanced" | "expanded">("balanced");
  const [motionOn, setMotionOn] = useState<boolean>(true);
  const [mode, setMode] = useState<"break" | "fix">("fix");

  const activeWork = useMemo(() => {
    return typedWorkItems.find((item) => item.slug === slug);
  }, [slug]);

  usePageMeta({
    title: activeWork ? `${activeWork.title} | Catalin Siegling` : "Project Not Found | Catalin Siegling",
    description: activeWork
      ? activeWork.summary ??
        "Interactive system view focused on tradeoffs, runtime states, and product decision quality."
      : "The project link you opened is no longer active on this portfolio.",
    path: activeWork ? `/work/${activeWork.slug}` : "/work",
    robots: activeWork ? "index,follow" : "noindex,nofollow"
  });

  if (!activeWork) {
    return (
      <div className="stack">
        <NotFoundState
          eyebrow="Missing Project"
          title="Project not found"
          description="That case study is not active anymore or the link is wrong. Use the work index to open a live project."
          backTo="/work"
          backLabel="Back to all systems"
        />
      </div>
    );
  }

  return (
    <div className="stack">
      <section className="surface">
        <p className="eyebrow">Project Breakdown</p>
        <h1>{activeWork.title}</h1>
        <p>{activeWork.context}</p>
        {activeWork.stack && <p className="muted">Stack: {activeWork.stack.join(", ")}</p>}
        <p>
          <Link className="inline-link" to="/work">
            Back to all systems
          </Link>
        </p>
        {activeWork.liveUrl && (
          <p>
            <a className="inline-link" href={activeWork.liveUrl} target="_blank" rel="noreferrer">
              Open live project
            </a>
          </p>
        )}
        <div className="button-row">
          <button className={mode === "break" ? "chip active danger" : "chip"} onClick={() => setMode("break")} type="button">
            break mode
          </button>
          <button className={mode === "fix" ? "chip active" : "chip"} onClick={() => setMode("fix")} type="button">
            fix mode
          </button>
          <button className={density === "compact" ? "chip active" : "chip"} onClick={() => setDensity("compact")} type="button">
            compact
          </button>
          <button
            className={density === "balanced" ? "chip active" : "chip"}
            onClick={() => setDensity("balanced")}
            type="button"
          >
            balanced
          </button>
          <button
            className={density === "expanded" ? "chip active" : "chip"}
            onClick={() => setDensity("expanded")}
            type="button"
          >
            expanded
          </button>
          <button className={motionOn ? "chip active" : "chip"} onClick={() => setMotionOn((value) => !value)} type="button">
            {motionOn ? "motion on" : "motion off"}
          </button>
        </div>
      </section>
      <LiveDemoFrame
        title={activeWork.title}
        hook={activeWork.demoHook}
        density={density}
        motionOn={motionOn}
        mode={mode}
        panels={activeWork.runtimePanels}
      />
      <WorkProofPanel work={activeWork} />
      <WorkJourneyRail checkpoints={activeWork.checkpoints} />
      <TradeoffPanel tradeoffs={activeWork.tradeoffs} />
      <PostmortemNotes notes={activeWork.postmortem} />
    </div>
  );
}
