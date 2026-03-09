import { useMemo, useState } from "react";
import { clamp } from "../../lib/math";

type StrategyId = "aggressive" | "balanced" | "conservative";
type PriorityMode = "latency-first" | "balanced" | "cost-first";

type Strategy = {
  id: StrategyId;
  name: string;
  polling: number;
  cacheTtl: number;
  retries: number;
};

type StrategyScore = {
  freshness: number;
  apiCost: number;
  duplicateRisk: number;
  resilience: number;
  composite: number;
};

type EnvironmentProfile = {
  id: string;
  label: string;
  trafficLoad: number;
  providerReliability: number;
  quotaHeadroom: number;
  userTolerance: number;
  note: string;
};

type RuntimeConditions = {
  trafficLoad: number;
  providerReliability: number;
  quotaHeadroom: number;
  userTolerance: number;
};

const strategies: Strategy[] = [
  { id: "aggressive", name: "Aggressive Polling", polling: 12, cacheTtl: 15, retries: 5 },
  { id: "balanced", name: "Balanced Runtime", polling: 30, cacheTtl: 45, retries: 3 },
  { id: "conservative", name: "Cache-First Budget", polling: 60, cacheTtl: 90, retries: 2 }
];

const environmentProfiles: EnvironmentProfile[] = [
  {
    id: "off-peak",
    label: "Off-peak stability",
    trafficLoad: 34,
    providerReliability: 86,
    quotaHeadroom: 72,
    userTolerance: 58,
    note: "Lower traffic and healthy provider quality."
  },
  {
    id: "regional-rush",
    label: "Regional rush",
    trafficLoad: 68,
    providerReliability: 74,
    quotaHeadroom: 46,
    userTolerance: 42,
    note: "More bursty load with average upstream quality."
  },
  {
    id: "high-pressure",
    label: "High pressure",
    trafficLoad: 88,
    providerReliability: 52,
    quotaHeadroom: 24,
    userTolerance: 28,
    note: "Unstable provider plus tight quota budget."
  }
];

function scoreStrategy(
  strategy: Strategy,
  trafficLoad: number,
  providerReliability: number,
  quotaHeadroom: number,
  userTolerance: number,
  mode: PriorityMode
): StrategyScore {
  const freshness = clamp(
    90 - strategy.polling * 0.55 - strategy.cacheTtl * 0.18 + trafficLoad * 0.16 + providerReliability * 0.08,
    5,
    99
  );
  const apiCost = clamp(
    strategy.polling * 0.95 + strategy.retries * 8 + trafficLoad * 0.42 - quotaHeadroom * 0.32 + strategy.cacheTtl * 0.1,
    1,
    99
  );
  const duplicateRisk = clamp(
    strategy.retries * 12 + strategy.polling * 0.3 + (100 - providerReliability) * 0.18 - userTolerance * 0.14,
    1,
    99
  );
  const resilience = clamp(
    42 + strategy.retries * 9 + strategy.cacheTtl * 0.15 + providerReliability * 0.28 - strategy.polling * 0.2,
    5,
    99
  );

  let composite = 0;
  if (mode === "latency-first") {
    composite = freshness * 0.45 + resilience * 0.3 - apiCost * 0.15 - duplicateRisk * 0.1;
  } else if (mode === "cost-first") {
    composite = freshness * 0.2 + resilience * 0.25 - apiCost * 0.4 - duplicateRisk * 0.15;
  } else {
    composite = freshness * 0.32 + resilience * 0.32 - apiCost * 0.2 - duplicateRisk * 0.16;
  }

  return {
    freshness: Math.round(freshness),
    apiCost: Math.round(apiCost),
    duplicateRisk: Math.round(duplicateRisk),
    resilience: Math.round(resilience),
    composite: Math.round(clamp(composite, 0, 100))
  };
}

function profileToConditions(profile: EnvironmentProfile): RuntimeConditions {
  return {
    trafficLoad: profile.trafficLoad,
    providerReliability: profile.providerReliability,
    quotaHeadroom: profile.quotaHeadroom,
    userTolerance: profile.userTolerance
  };
}

export function DecisionSimulator() {
  const [priorityMode, setPriorityMode] = useState<PriorityMode>("balanced");
  const [profileId, setProfileId] = useState<string>(environmentProfiles[1].id);
  const [baselineProfileId, setBaselineProfileId] = useState<string>(environmentProfiles[1].id);
  const [conditions, setConditions] = useState<RuntimeConditions>(() => profileToConditions(environmentProfiles[1]));

  const activeProfile = useMemo(() => {
    return environmentProfiles.find((profile) => profile.id === baselineProfileId) ?? environmentProfiles[1];
  }, [baselineProfileId]);

  const applyProfile = (nextProfileId: string) => {
    const nextProfile = environmentProfiles.find((profile) => profile.id === nextProfileId);
    if (!nextProfile) {
      return;
    }
    setProfileId(nextProfile.id);
    setBaselineProfileId(nextProfile.id);
    setConditions(profileToConditions(nextProfile));
  };

  const mutateConditions = (update: Partial<RuntimeConditions>) => {
    setProfileId("custom");
    setConditions((prev) => ({
      trafficLoad: clamp(update.trafficLoad ?? prev.trafficLoad, 0, 100),
      providerReliability: clamp(update.providerReliability ?? prev.providerReliability, 0, 100),
      quotaHeadroom: clamp(update.quotaHeadroom ?? prev.quotaHeadroom, 0, 100),
      userTolerance: clamp(update.userTolerance ?? prev.userTolerance, 0, 100)
    }));
  };

  const strategyScores = useMemo(() => {
    return strategies.map((strategy) => ({
      strategy,
      score: scoreStrategy(
        strategy,
        conditions.trafficLoad,
        conditions.providerReliability,
        conditions.quotaHeadroom,
        conditions.userTolerance,
        priorityMode
      )
    }));
  }, [conditions, priorityMode]);

  const recommended = useMemo(() => {
    return [...strategyScores].sort((a, b) => b.score.composite - a.score.composite)[0];
  }, [strategyScores]);

  return (
    <section className="surface strategy-sim">
      <p className="eyebrow">Runtime Decision Matrix</p>
      <h2>Choose runtime strategy based on constraints, not vibes.</h2>
      <p>
        This compares three real strategy styles I use in bot work. Pick an operating window and inject live stress
        events to see how the recommendation changes.
      </p>

      <div className="button-row">
        <button
          className={priorityMode === "latency-first" ? "chip active" : "chip"}
          onClick={() => setPriorityMode("latency-first")}
          type="button"
        >
          latency first
        </button>
        <button className={priorityMode === "balanced" ? "chip active" : "chip"} onClick={() => setPriorityMode("balanced")} type="button">
          balanced
        </button>
        <button className={priorityMode === "cost-first" ? "chip active" : "chip"} onClick={() => setPriorityMode("cost-first")} type="button">
          cost first
        </button>
      </div>

      <div className="strategy-grid">
        <article className="card strategy-controls">
          <h3>Operating window</h3>
          <div className="button-row compact">
            {environmentProfiles.map((profile) => (
              <button
                className={profileId === profile.id ? "chip active" : "chip"}
                key={profile.id}
                onClick={() => applyProfile(profile.id)}
                type="button"
              >
                {profile.label}
              </button>
            ))}
            <button
              className={profileId === "custom" ? "chip active danger" : "chip"}
              onClick={() => setProfileId("custom")}
              type="button"
            >
              custom
            </button>
          </div>
          <p className="muted">{profileId === "custom" ? `Custom state based on ${activeProfile.label}.` : activeProfile.note}</p>

          <div className="control-stat-list">
            <div className="metric-row">
              <span>Traffic load</span>
              <strong>{conditions.trafficLoad}</strong>
            </div>
            <div className="metric-row">
              <span>Provider reliability</span>
              <strong>{conditions.providerReliability}</strong>
            </div>
            <div className="metric-row">
              <span>API quota headroom</span>
              <strong>{conditions.quotaHeadroom}</strong>
            </div>
            <div className="metric-row">
              <span>User delay tolerance</span>
              <strong>{conditions.userTolerance}</strong>
            </div>
          </div>

          <div className="button-row compact">
            <button
              className="chip danger"
              onClick={() =>
                mutateConditions({
                  trafficLoad: conditions.trafficLoad + 18,
                  providerReliability: conditions.providerReliability - 7,
                  quotaHeadroom: conditions.quotaHeadroom - 6
                })
              }
              type="button"
            >
              kickoff traffic spike
            </button>
            <button
              className="chip danger"
              onClick={() => mutateConditions({ providerReliability: conditions.providerReliability - 20 })}
              type="button"
            >
              provider wobble
            </button>
            <button
              className="chip danger"
              onClick={() => mutateConditions({ quotaHeadroom: conditions.quotaHeadroom - 24 })}
              type="button"
            >
              quota squeeze
            </button>
            <button
              className="chip danger"
              onClick={() => mutateConditions({ userTolerance: conditions.userTolerance - 20 })}
              type="button"
            >
              impatient users
            </button>
            <button
              className="chip"
              onClick={() =>
                mutateConditions({
                  trafficLoad: conditions.trafficLoad - 12,
                  providerReliability: conditions.providerReliability + 15,
                  quotaHeadroom: conditions.quotaHeadroom + 18,
                  userTolerance: conditions.userTolerance + 12
                })
              }
              type="button"
            >
              stabilize window
            </button>
            <button className="chip" onClick={() => applyProfile(activeProfile.id)} type="button">
              reset baseline
            </button>
          </div>
        </article>

        <article className="card strategy-results">
          <h3>Recommendation</h3>
          {recommended ? (
            <>
              <p className="tag">{recommended.strategy.name}</p>
              <p className="sim-reco">
                Composite score {recommended.score.composite}. In this environment, this strategy gives the best
                stability-to-cost balance.
              </p>
            </>
          ) : null}

          <div className="strategy-table-wrap">
            <table className="strategy-table">
              <thead>
                <tr>
                  <th>Strategy</th>
                  <th>Freshness</th>
                  <th>API Cost</th>
                  <th>Dup Risk</th>
                  <th>Resilience</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {strategyScores.map((row) => {
                  const isTop = recommended?.strategy.id === row.strategy.id;
                  return (
                    <tr key={row.strategy.id} className={isTop ? "top-row" : ""}>
                      <td>{row.strategy.name}</td>
                      <td>{row.score.freshness}</td>
                      <td>{row.score.apiCost}</td>
                      <td>{row.score.duplicateRisk}</td>
                      <td>{row.score.resilience}</td>
                      <td>{row.score.composite}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </section>
  );
}
