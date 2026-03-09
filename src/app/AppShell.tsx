import { NavLink, Outlet, useLocation } from "react-router-dom";
import { TopNav } from "../components/layout/TopNav";
import { Footer } from "../components/layout/Footer";
import workItems from "../content/work.json";
import type { WorkItem } from "../types/content";
import { usePlausiblePageviews } from "../lib/analytics";

const typedWorkItems = workItems as WorkItem[];

function latestTickerText() {
  const flagship = typedWorkItems.find((item) => item.slug === "live-alert-bot-core") ?? typedWorkItems[0];
  if (!flagship) {
    return "Live modules: bot runtime · scheduler health · queue control";
  }

  const proof = flagship.proofStats?.slice(0, 4).map((item) => `${item.value} ${item.label.toLowerCase()}`) ?? [];
  return proof.length ? `Bot core: ${proof.join(" · ")}` : `Live modules: ${flagship.title}`;
}

export function AppShell() {
  const location = useLocation();
  usePlausiblePageviews();

  return (
    <div className="app-shell">
      <TopNav />
      <div className="ticker">{latestTickerText()}</div>
      <main className="page-wrap">
        <div className="route-stage" key={location.pathname}>
          <Outlet />
        </div>
      </main>
      <aside className="quick-jump">
        <NavLink to="/work">Open Work Systems</NavLink>
        <NavLink to="/work/live-alert-bot-core">Open Bot Project</NavLink>
        <NavLink to="/work/trek-field-guide">Open Field Guide</NavLink>
        <NavLink to="/playground">Enter Playground</NavLink>
        <NavLink to="/lab-log">Open Build Feed</NavLink>
      </aside>
      <Footer />
    </div>
  );
}
