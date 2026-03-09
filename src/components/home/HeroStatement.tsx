import evidence from "../../content/evidence.json";

type EvidenceSnapshot = {
  counts: {
    commandModules: number;
    serviceModules: number;
    schedulerLoops: number;
    testFiles: number;
  };
};

const snapshot = evidence as EvidenceSnapshot;
const heroProof = [
  `${snapshot.counts.commandModules} command modules`,
  `${snapshot.counts.serviceModules} service modules`,
  `${snapshot.counts.schedulerLoops} scheduler loops`,
  `${snapshot.counts.testFiles} test files`
];

export function HeroStatement() {
  return (
    <section className="hero surface">
      <p className="eyebrow">Redacted Production System</p>
      <h1>
        I built a live sports bot with real operator surfaces, and this portfolio hides the community
        identity without hiding the engineering.
      </h1>
      <p className="lede">
        What stays visible: runtime health, incident recovery, scheduler orchestration, cache layers,
        deploy hardening, and the git trail behind the fixes. What stays hidden: the community itself.
      </p>
      <div className="hero-proof-row" aria-label="Bot proof summary">
        {heroProof.map((item) => (
          <span key={item} className="hero-proof-pill">
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}
