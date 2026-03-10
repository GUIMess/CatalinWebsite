import logs from "../content/logs.json";
import type { LogEntry } from "../types/content";
import { LogEntryList } from "../components/lab/LogEntryList";
import { usePageMeta } from "../lib/seo";

const sortedEntries = (logs as LogEntry[]).slice().sort((a, b) => b.date.localeCompare(a.date));

export function LabLogPage() {
  usePageMeta({
    title: "Build Feed | Catalin Siegling",
    description:
      "Chronological build notes covering shipped work, mistakes, and iteration.",
    path: "/lab-log"
  });

  return (
    <div className="stack">
      <section className="surface page-intro">
        <p className="eyebrow">Build Feed</p>
        <h1>Recent changes, in order.</h1>
        <p>
          Short notes on what changed, what it taught me, and where it connects back to the larger system.
        </p>
      </section>
      <LogEntryList entries={sortedEntries} />
    </div>
  );
}
