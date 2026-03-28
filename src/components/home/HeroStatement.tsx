import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import evidence from "../../content/evidence.json";

type EvidenceSnapshot = {
  counts: {
    commandModules: number;
    serviceModules: number;
    schedulerLoops: number;
    testFiles: number;
    dashboardTsxFiles: number;
    runtimeTarget: string;
  };
  schedulerLoops: Array<{
    name: string;
    interval: string;
  }>;
  endpoints: string[];
};

const snapshot = evidence as EvidenceSnapshot;
const skylineStats = [
  { label: "commands", value: snapshot.counts.commandModules },
  { label: "services", value: snapshot.counts.serviceModules },
  { label: "loops", value: snapshot.counts.schedulerLoops },
  { label: "tests", value: snapshot.counts.testFiles }
];
const fastLoops = snapshot.schedulerLoops.slice(0, 3);
const chapterLinks = [
  { href: "#live-proof", index: "01", label: "Live proof", note: "runtime telemetry" },
  { href: "#system-builds", index: "02", label: "Build arc", note: "flagship system" },
  { href: "#recent-fixes", index: "03", label: "Recent fixes", note: "real break / fix work" }
];
const safeSurfaces =
  ["/api/public/portfolio-telemetry", "/health", "/status", "/live-updates"].filter((endpoint) =>
    snapshot.endpoints.includes(endpoint)
  ) || [];
const stageFacts = [
  { label: "runtime", value: snapshot.counts.runtimeTarget },
  { label: "public routes", value: `${snapshot.endpoints.length}` },
  { label: "ops views", value: `${snapshot.counts.dashboardTsxFiles}` }
];
const maxSkylineValue = Math.max(...skylineStats.map((stat) => stat.value), 1);

export function HeroStatement() {
  return (
    <section className="hero hero-editorial surface home-hero-scene">
      <div className="home-hero-layout">
        <div className="hero-copy hero-copy-scene">
          <p className="eyebrow">System View</p>
          <h1>
            Live systems,
            <br />
            built to hold
            <br />
            together when
            <br />
            the noisy parts
            <br />
            show up.
          </h1>
          <p className="lede">
            I build and maintain a production Discord bot that delivers live scores, rankings, and news to a large sports community — solo, on Railway, with a real ops layer behind it.
          </p>
          <div className="button-row hero-actions">
            <Link className="inline-link" to="/work/live-alert-bot-core">
              Open flagship system
            </Link>
            <Link className="inline-link" to="/lab-log">
              See recent fixes
            </Link>
          </div>
          <div className="home-chapter-rail" aria-label="Home chapters">
            {chapterLinks.map((link) => (
              <a className="chapter-rail-link" href={link.href} key={link.href}>
                <span>{link.index}</span>
                <strong>{link.label}</strong>
                <small>{link.note}</small>
              </a>
            ))}
          </div>
        </div>
        <aside className="hero-tableau" aria-label="System footprint">
          <div className="hero-tableau-head">
            <p className="tag">Current shape</p>
            <p className="hero-proof-kicker">From the live repository.</p>
          </div>
          <div className="hero-skyline" aria-label="System footprint skyline">
            {skylineStats.map((stat) => {
              const height = 28 + Math.round((stat.value / maxSkylineValue) * 72);

              return (
                <article className="hero-skyline-column" key={stat.label}>
                  <span className="hero-skyline-count">{stat.value}</span>
                  <div className="hero-skyline-rail" aria-hidden="true">
                    <div className="hero-skyline-fill" style={{ height: `${height}%` } as CSSProperties} />
                  </div>
                  <small>{stat.label}</small>
                </article>
              );
            })}
          </div>
          <div className="hero-loop-ribbon" aria-label="Fast loops">
            {fastLoops.map((loop) => (
              <article className="hero-loop-chip" key={loop.name}>
                <span>{loop.name}</span>
                <strong>{loop.interval}</strong>
              </article>
            ))}
          </div>
          <div className="hero-tableau-footer">
            <div className="hero-stage-facts">
              {stageFacts.map((fact) => (
                <article className="hero-stage-fact" key={fact.label}>
                  <span>{fact.label}</span>
                  <strong>{fact.value}</strong>
                </article>
              ))}
            </div>
            <div className="hero-surface-list" aria-label="Public-safe surfaces">
              {safeSurfaces.map((surface) => (
                <span className="hero-surface-pill" key={surface}>
                  {surface}
                </span>
              ))}
              {!safeSurfaces.length ? (
                <span className="hero-surface-pill">Public-safe surfaces loading</span>
              ) : null}
            </div>
            <Link className="hero-tableau-link" to="/work">
              Browse all system views
            </Link>
          </div>
        </aside>
      </div>
    </section>
  );
}
