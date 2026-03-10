import { Outlet, useLocation } from "react-router-dom";
import { TopNav } from "../components/layout/TopNav";
import { Footer } from "../components/layout/Footer";
import { usePlausiblePageviews } from "../lib/analytics";

export function AppShell() {
  const location = useLocation();
  usePlausiblePageviews();

  return (
    <div className="app-shell authored-shell">
      <div className="shell-orbit shell-orbit-left" aria-hidden="true" />
      <div className="shell-orbit shell-orbit-right" aria-hidden="true" />
      <TopNav />
      <main className="page-wrap page-wrap-authored">
        <div className="route-stage route-stage-authored" key={location.pathname}>
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
}
