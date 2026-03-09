import type { WorkItem } from "../../types/content";
import evidence from "../../content/evidence.json";

type EvidenceSnapshot = {
  generatedAt: string;
  schedulerLoops: Array<{ name: string; interval: string }>;
  receipts: Array<{ label: string; file: string; line: number; signal: string }>;
};

const snapshot = evidence as EvidenceSnapshot;

type WorkProofPanelProps = {
  work: WorkItem;
};

export function WorkProofPanel({ work }: WorkProofPanelProps) {
  if (!work.proofStats?.length && !work.architectureNotes?.length && !work.reliabilityNotes?.length && !work.codeReceipts?.length) {
    return null;
  }

  const isFlagship = work.slug === "live-alert-bot-core";

  return (
    <section className="surface">
      <p className="eyebrow">Code-Backed Proof</p>
      <h2>What this project actually contains</h2>

      {work.proofStats?.length ? (
        <div className="proof-stat-grid">
          {work.proofStats.map((stat) => (
            <article className="card proof-stat-card" key={stat.label}>
              <p className="tag">{stat.label}</p>
              <h3>{stat.value}</h3>
            </article>
          ))}
        </div>
      ) : null}

      <div className="proof-notes-grid">
        {work.architectureNotes?.length ? (
          <article className="card">
            <h3>Architecture Notes</h3>
            <ul className="notes-list">
              {work.architectureNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </article>
        ) : null}

        {work.reliabilityNotes?.length ? (
          <article className="card">
            <h3>Reliability Notes</h3>
            <ul className="notes-list">
              {work.reliabilityNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </article>
        ) : null}
      </div>

      {work.codeReceipts?.length ? (
        <div className="receipt-grid">
          {work.codeReceipts.map((receipt) => (
            <article className="card receipt-card" key={`${receipt.file}-${receipt.title}`}>
              <p className="tag">{receipt.file}</p>
              <h3>{receipt.title}</h3>
              <pre className="receipt-snippet">
                <code>{receipt.snippet}</code>
              </pre>
            </article>
          ))}
        </div>
      ) : null}

      {isFlagship ? (
        <div className="snapshot-grid">
          <article className="card">
            <h3>Generated Evidence Feed</h3>
            <p className="muted">Snapshot: {new Date(snapshot.generatedAt).toLocaleString("en-US")}</p>
            <ul className="notes-list">
              {snapshot.receipts.slice(0, 4).map((receipt) => (
                <li key={`${receipt.file}-${receipt.line}`}>
                  {receipt.label} · {receipt.file}:{receipt.line}
                </li>
              ))}
            </ul>
          </article>
          <article className="card">
            <h3>Scheduler Loop Cadence</h3>
            <ul className="notes-list">
              {snapshot.schedulerLoops.slice(0, 8).map((loop) => (
                <li key={loop.name}>
                  {loop.name} · {loop.interval}
                </li>
              ))}
            </ul>
          </article>
        </div>
      ) : null}
    </section>
  );
}
