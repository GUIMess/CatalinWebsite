import { Link } from "react-router-dom";
import experiments from "../../content/experiments.json";
import type { Experiment } from "../../types/content";

const featured = (experiments as Experiment[]).filter((item) => item.featured).slice(0, 3);

export function FeaturedExperiments() {
  return (
    <section className="surface home-experiments-section">
      <div className="split-header">
        <div>
          <p className="eyebrow">Technical Decisions</p>
          <h2>Specific problems I tested and solved in the bot.</h2>
        </div>
        <Link className="inline-link" to="/playground">
          Open all experiments
        </Link>
      </div>
      <div className="card-grid">
        {featured.map((item) => (
          <article key={item.id} className="card">
            <p className="tag">{item.category}</p>
            <h3>{item.title}</h3>
            <p>{item.summary}</p>
            <p className="muted">{item.result}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
