import evidence from "../../content/evidence.json";
import { botControlSurfaces, botIncidentLedger, botLogTape, botTopology } from "../../content/botBriefing";

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
    intervalMs: number | null;
  }>;
  endpoints: string[];
  operatorDashboardSnapshot?: {
    summary: string;
    panels: Array<{
      title: string;
      route: string;
      badge: string;
      detail: string;
      fields: string[];
      scrub: string;
      receipts: Array<{
        label: string;
        file: string;
        line: number;
      }>;
    }>;
    memoryThresholds: Array<{
      label: string;
      value: string;
      note: string;
    }>;
    cadenceNotes: Array<{
      label: string;
      value: string;
    }>;
    accessRules: string[];
  };
  pressureProfile?: {
    summary: string;
    metrics: Array<{
      label: string;
      value: string;
      detail: string;
    }>;
    operatorSurfaces: string[];
    notes: string[];
    recoveryRails: Array<{
      label: string;
      detail: string;
      file: string;
      line: number;
    }>;
  };
  incidentTimeline?: Array<{
    id: string;
    category: string;
    date: string | null;
    title: string;
    summary: string;
    outcome: string;
    logReceipt: string | null;
    commits: Array<{
      hash: string;
      date: string;
      summary: string;
    }>;
    sourceReceipts: Array<{
      label: string;
      file: string;
      line: number;
    }>;
  }>;
  recentOpsMoves?: Array<{
    hash: string;
    date: string;
    summary: string;
    category: string;
  }>;
  receipts: Array<{
    label: string;
    file: string;
    line: number;
  }>;
};

const snapshot = evidence as EvidenceSnapshot;

const proofStats = [
  { label: "Command modules", value: `${snapshot.counts.commandModules}` },
  { label: "Service modules", value: `${snapshot.counts.serviceModules}` },
  { label: "Scheduler loops", value: `${snapshot.counts.schedulerLoops}` },
  { label: "Test files", value: `${snapshot.counts.testFiles}` },
  { label: "Dashboard files", value: `${snapshot.counts.dashboardTsxFiles}` }
];

const endpointHighlights = snapshot.endpoints.filter((endpoint) =>
  ["/health", "/status", "/live-updates", "/dashboard"].includes(endpoint)
);

const loopHighlights = snapshot.schedulerLoops
  .filter((loop) => loop.intervalMs !== null)
  .sort((a, b) => (a.intervalMs ?? 0) - (b.intervalMs ?? 0))
  .slice(0, 4);

const pressureProfile = snapshot.pressureProfile;
const operatorDashboardSnapshot = snapshot.operatorDashboardSnapshot;
const incidentTimeline = snapshot.incidentTimeline ?? [];
const recentOpsMoves = snapshot.recentOpsMoves ?? [];

export function BotOperatorBriefing() {
  return (
    <section className="surface operator-briefing">
      <div className="split-header">
        <div>
          <p className="eyebrow">Redacted Operator Briefing</p>
          <h2>The community stays hidden. The operating system does not.</h2>
          <p>
            This portfolio strips away the server identity but keeps the interesting parts visible:
            startup phases, runtime surfaces, scheduler health, fallback logic, analytics recovery,
            and recent git-backed hardening work.
          </p>
        </div>
      </div>

      <p className="muted sanitization-note">
        Redacted on purpose: community name, invites, IDs, channel structure, and any breadcrumb that
        points back to the live server.
      </p>

      <div className="bot-proof-grid">
        {proofStats.map((stat) => (
          <article key={stat.label} className="card bot-proof-card">
            <p className="tag">{stat.label}</p>
            <h3>{stat.value}</h3>
          </article>
        ))}
      </div>

      {operatorDashboardSnapshot ? (
        <article className="card operator-snapshot-card">
          <div className="split-header operator-snapshot-header">
            <div>
              <p className="tag">Operator Dashboard Snapshot</p>
              <h3>Sanitized control surfaces from the bot's actual health and status routes</h3>
            </div>
            <p className="muted operator-snapshot-note">{operatorDashboardSnapshot.summary}</p>
          </div>

          <div className="surface-snapshot-grid">
            {operatorDashboardSnapshot.panels.map((panel) => (
              <section key={`${panel.badge}-${panel.route}`} className="surface-panel">
                <div className="surface-panel-meta">
                  <span className="receipt-pill">{panel.badge}</span>
                  <code>{panel.route}</code>
                </div>
                <h4>{panel.title}</h4>
                <p>{panel.detail}</p>
                <div className="surface-fields">
                  {panel.fields.map((field) => (
                    <span key={field} className="surface-field-pill">
                      {field}
                    </span>
                  ))}
                </div>
                <p className="muted surface-scrub-note">{panel.scrub}</p>
                <ul className="notes-list surface-receipt-list">
                  {panel.receipts.map((receipt) => (
                    <li key={`${receipt.file}-${receipt.line}`}>
                      {receipt.label} · {receipt.file}:{receipt.line}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <div className="operator-briefing-grid operator-snapshot-tail">
            <div>
              <span className="step-label">Memory rails</span>
              <div className="threshold-grid">
                {operatorDashboardSnapshot.memoryThresholds.map((threshold) => (
                  <section key={threshold.label} className="threshold-card">
                    <span className="step-label">{threshold.label}</span>
                    <strong>{threshold.value}</strong>
                    <p>{threshold.note}</p>
                  </section>
                ))}
              </div>
            </div>

            <div>
              <span className="step-label">Access rules</span>
              <ul className="notes-list pressure-note-list">
                {operatorDashboardSnapshot.accessRules.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>

              <span className="step-label">Cadence</span>
              <div className="receipt-pill-row">
                {operatorDashboardSnapshot.cadenceNotes.map((note) => (
                  <span key={note.label} className="receipt-pill">
                    {note.label} · {note.value}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </article>
      ) : null}

      {pressureProfile ? (
        <article className="card pressure-card">
          <div className="split-header pressure-card-header">
            <div>
              <p className="tag">Systems Pressure Snapshot</p>
              <h3>Checked-in runtime pressure cues from the bot source</h3>
            </div>
            <p className="muted pressure-card-note">{pressureProfile.summary}</p>
          </div>

          <div className="pressure-metric-grid">
            {pressureProfile.metrics.map((metric) => (
              <section key={metric.label} className="pressure-metric">
                <span className="step-label">{metric.label}</span>
                <strong>{metric.value}</strong>
                <p>{metric.detail}</p>
              </section>
            ))}
          </div>

          <div className="operator-briefing-grid pressure-card-tail">
            <div>
              <span className="step-label">Operator surfaces</span>
              <div className="receipt-pill-row">
                {pressureProfile.operatorSurfaces.map((surface) => (
                  <span key={surface} className="receipt-pill">
                    {surface}
                  </span>
                ))}
              </div>

              <span className="step-label">Snapshot notes</span>
              <ul className="notes-list pressure-note-list">
                {pressureProfile.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </div>

            <div>
              <span className="step-label">Recovery rails</span>
              <ul className="notes-list pressure-rail-list">
                {pressureProfile.recoveryRails.map((rail) => (
                  <li key={`${rail.file}-${rail.line}`}>
                    <strong>{rail.label}</strong>: {rail.detail} · {rail.file}:{rail.line}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </article>
      ) : null}

      <div className="operator-briefing-grid">
        <article className="card briefing-card">
          <p className="tag">System Topology</p>
          <h3>What actually has to run for the bot to stay healthy</h3>
          <div className="briefing-step-list">
            {botTopology.map((step) => (
              <section key={step.title} className="briefing-step">
                <h4>{step.title}</h4>
                <p>{step.summary}</p>
                <div className="receipt-pill-row">
                  {step.evidence.map((receipt) => (
                    <span key={receipt} className="receipt-pill">
                      {receipt}
                    </span>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </article>

        <article className="card briefing-card">
          <p className="tag">Control Surfaces</p>
          <h3>What lets the runtime degrade cleanly instead of just breaking</h3>
          <div className="briefing-step-list">
            {botControlSurfaces.map((surface) => (
              <section key={surface.title} className="briefing-step">
                <h4>{surface.title}</h4>
                <p>{surface.summary}</p>
                <p className="muted briefing-signal">{surface.signal}</p>
              </section>
            ))}
          </div>

          <div className="briefing-signal-grid">
            <div>
              <span className="step-label">Live endpoints</span>
              <div className="receipt-pill-row">
                {endpointHighlights.map((endpoint) => (
                  <span key={endpoint} className="receipt-pill">
                    {endpoint}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="step-label">Fast loops</span>
              <div className="receipt-pill-row">
                {loopHighlights.map((loop) => (
                  <span key={loop.name} className="receipt-pill">
                    {loop.name} · {loop.interval}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="step-label">Source receipts</span>
              <ul className="notes-list briefing-receipt-list">
                {snapshot.receipts.map((receipt) => (
                  <li key={`${receipt.file}-${receipt.line}`}>
                    {receipt.label} · {receipt.file}:{receipt.line}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </article>
      </div>

      <div className="incident-ledger-grid">
        {botIncidentLedger.map((incident) => (
          <article key={incident.id} className="card ledger-card">
            <p className="tag">Incident Ledger</p>
            <h3>{incident.title}</h3>

            <div className="ledger-detail">
              <span className="step-label">Symptom</span>
              <p>{incident.symptom}</p>
            </div>

            <div className="ledger-detail">
              <span className="step-label">Cause</span>
              <p>{incident.cause}</p>
            </div>

            <div className="ledger-detail">
              <span className="step-label">Fix</span>
              <p>{incident.fix}</p>
            </div>

            <div className="ledger-detail">
              <span className="step-label">Outcome</span>
              <p>{incident.outcome}</p>
            </div>

            <div className="receipt-pill-row">
              {incident.receipts.map((receipt) => (
                <span key={receipt} className="receipt-pill">
                  {receipt}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>

      <article className="card log-tape-card">
        <p className="tag">Redacted Runtime Tape</p>
        <h3>Real message shapes from the bot source, scrubbed for public display</h3>
        <p className="muted">
          These are source-derived logger messages and failure paths, not invented terminal filler.
        </p>
        <div className="log-tape">
          {botLogTape.map((entry) => (
            <div key={`${entry.channel}-${entry.message}`} className="log-tape-row">
              <span className="log-tape-channel">{entry.channel}</span>
              <code className="log-tape-message">{entry.message}</code>
              <span className="log-tape-receipt">{entry.receipt}</span>
            </div>
          ))}
        </div>
      </article>

      <div className="operator-briefing-grid operator-briefing-tail">
        <article className="card briefing-card timeline-card">
          <p className="tag">Recent Intervention Timeline</p>
          <h3>Git-backed incidents and the receipts that explain them</h3>
          {incidentTimeline.length ? (
            <div className="intervention-timeline">
              {incidentTimeline.map((entry) => (
                <article key={entry.id} className="timeline-entry">
                  <div className="timeline-meta">
                    <span className="commit-category">{entry.category}</span>
                    {entry.date ? <span>{entry.date}</span> : null}
                  </div>
                  <h4>{entry.title}</h4>
                  <p>{entry.summary}</p>
                  <p className="muted timeline-outcome">{entry.outcome}</p>

                  {entry.logReceipt ? <code className="timeline-log-receipt">{entry.logReceipt}</code> : null}

                  <span className="step-label">Git receipts</span>
                  <ul className="notes-list timeline-commit-list">
                    {entry.commits.map((commit) => (
                      <li key={commit.hash}>
                        {commit.date} · {commit.hash} · {commit.summary}
                      </li>
                    ))}
                  </ul>

                  <span className="step-label">Source receipts</span>
                  <ul className="notes-list timeline-source-list">
                    {entry.sourceReceipts.map((receipt) => (
                      <li key={`${receipt.file}-${receipt.line}`}>
                        {receipt.label} · {receipt.file}:{receipt.line}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          ) : recentOpsMoves.length ? (
            <div className="commit-trail">
              {recentOpsMoves.map((move) => (
                <article key={`${move.hash}-${move.summary}`} className="commit-row">
                  <div className="commit-meta">
                    <span className="commit-category">{move.category}</span>
                    <span>{move.date}</span>
                    <span>{move.hash}</span>
                  </div>
                  <p>{move.summary}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className="muted">
              Recent git receipts were unavailable during this build, but the operator surfaces and source
              receipts above are still derived from the live bot repo.
            </p>
          )}
        </article>

        <article className="card briefing-card">
          <p className="tag">Sanitization Rules</p>
          <h3>What stays hidden in this portfolio</h3>
          <ul className="notes-list">
            <li>Community name, invite surface, and server-specific identity</li>
            <li>User IDs, moderator tooling details, and channel naming</li>
            <li>Anything that would turn an engineering portfolio into a breadcrumb trail</li>
          </ul>
          <p className="muted">
            The goal is to show systems thinking, failure handling, and operational maturity without
            turning the site into a map back to the live community.
          </p>
        </article>
      </div>
    </section>
  );
}
