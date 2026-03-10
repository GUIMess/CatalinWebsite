import type { Tradeoff } from "../../types/content";

type TradeoffPanelProps = {
  tradeoffs: Tradeoff[];
};

export function TradeoffPanel({ tradeoffs }: TradeoffPanelProps) {
  return (
    <section className="surface">
      <p className="eyebrow">Tradeoffs</p>
      <h2>The choices that help one thing and tax another</h2>
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
