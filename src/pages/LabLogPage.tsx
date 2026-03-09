import logs from "../content/logs.json";
import type { LogEntry } from "../types/content";
import { LogEntryList } from "../components/lab/LogEntryList";
import { usePageMeta } from "../lib/seo";

const sortedEntries = (logs as LogEntry[]).slice().sort((a, b) => b.date.localeCompare(a.date));

export function LabLogPage() {
  usePageMeta({
    title: "Build Feed | Catalin Siegling",
    description:
      "Build log from an entry-level dev: shipped work, mistakes, and iteration notes.",
    path: "/lab-log"
  });

  return (
    <div className="stack">
      <section className="surface">
        <p className="eyebrow">Build Feed</p>
        <h1>One-year bot journey: what I shipped, what broke, what I learned.</h1>
        <p>
          No fake polish here. This is the timeline of real changes and lessons from the work above.
        </p>
      </section>
      <LogEntryList entries={sortedEntries} />
    </div>
  );
}
