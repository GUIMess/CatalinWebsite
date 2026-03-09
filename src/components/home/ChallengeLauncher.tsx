import { useMemo, useState } from "react";
import scenarios from "../../content/scenarios.json";
import type { Scenario } from "../../types/content";

const typedScenarios = scenarios as Scenario[];

export function ChallengeLauncher() {
  const [activeId, setActiveId] = useState<string>(typedScenarios[0]?.id ?? "");

  const activeScenario = useMemo(
    () => typedScenarios.find((scenario) => scenario.id === activeId) ?? typedScenarios[0],
    [activeId]
  );

  return (
    <section className="surface challenge-launcher">
      <p className="eyebrow">Challenge Launcher</p>
      <h2>Choose a problem. See the first thing I would try.</h2>
      <div className="button-row">
        {typedScenarios.map((scenario) => (
          <button
            key={scenario.id}
            className={scenario.id === activeScenario.id ? "chip active" : "chip"}
            onClick={() => setActiveId(scenario.id)}
            type="button"
          >
            {scenario.title}
          </button>
        ))}
      </div>
      <article className="scenario-card">
        <h3>{activeScenario.title}</h3>
        <p>{activeScenario.prompt}</p>
        <p className="response">First move I would test this week: {activeScenario.response}</p>
      </article>
    </section>
  );
}
