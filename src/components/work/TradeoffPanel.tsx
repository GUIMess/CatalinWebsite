import type { Tradeoff } from "../../types/content";

type TradeoffPanelProps = {
  tradeoffs: Tradeoff[];
};

export function TradeoffPanel({ tradeoffs }: TradeoffPanelProps) {
  return (
    <section className="surface">
      <p className="eyebrow">Control Surface</p>
      <h2>What gets better, what gets worse</h2>
      <div className="tradeoff-list">
        {tradeoffs.map((tradeoff) => (
          <article key={tradeoff.label} className="card tradeoff-card">
            <h3>{tradeoff.label}</h3>
            <p>
              <strong>Benefit:</strong> {tradeoff.benefit}
            </p>
            <p>
              <strong>Cost:</strong> {tradeoff.cost}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
