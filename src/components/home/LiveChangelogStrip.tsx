import { Link } from "react-router-dom";
import logs from "../../content/logs.json";
import type { LogEntry } from "../../types/content";

const entries = (logs as LogEntry[]).slice().sort((a, b) => b.date.localeCompare(a.date));

export function LiveChangelogStrip() {
  const latest = entries[0];
  const recent = entries.slice(0, 3);

  if (!latest) {
    return null;
  }

  return (
    <section className="surface changelog-strip">
      <div className="split-header">
        <div>
          <p className="eyebrow">Live Changelog</p>
          <h2>Last shipped: {latest.date}</h2>
          <p>{latest.build}</p>
        </div>
        <Link className="inline-link" to="/lab-log">
          Open full timeline
        </Link>
      </div>
      <div className="changelog-row">
        {recent.map((entry) => (
          <article className="card changelog-card" key={entry.id}>
            <p className="tag">
              {entry.date} · {entry.stage}
            </p>
            <p>{entry.learned}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
