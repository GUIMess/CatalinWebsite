import { useMemo, useState } from "react";

type LaneId = "now" | "next" | "later";

type Task = {
  id: string;
  title: string;
  impact: number;
  effort: number;
  risk: number;
};

const tasks: Task[] = [
  { id: "task-dedupe", title: "Harden dedupe fingerprint logic", impact: 9, effort: 6, risk: 5 },
  { id: "task-queue", title: "Tune queue throughput and backpressure", impact: 9, effort: 7, risk: 6 },
  { id: "task-scheduler", title: "Improve scheduler stale detection", impact: 8, effort: 5, risk: 4 },
  { id: "task-cache", title: "Refine cache TTL ladder by data type", impact: 7, effort: 4, risk: 3 },
  { id: "task-auth", title: "Tighten dashboard session boundaries", impact: 8, effort: 6, risk: 6 },
  { id: "task-render", title: "Optimize heavy image render jobs", impact: 6, effort: 8, risk: 5 }
];

const initialLanes: Record<LaneId, string[]> = {
  now: ["task-dedupe", "task-cache"],
  next: ["task-scheduler", "task-queue"],
  later: ["task-auth", "task-render"]
};

const laneTitles: Record<LaneId, string> = {
  now: "Now",
  next: "Next",
  later: "Later"
};

function scoreTask(task: Task): number {
  return Math.round(task.impact * 14 - task.effort * 6 - task.risk * 5);
}

function removeFromAllLanes(lanes: Record<LaneId, string[]>, taskId: string): Record<LaneId, string[]> {
  return {
    now: lanes.now.filter((id) => id !== taskId),
    next: lanes.next.filter((id) => id !== taskId),
    later: lanes.later.filter((id) => id !== taskId)
  };
}

export function PriorityBoard() {
  const [lanes, setLanes] = useState<Record<LaneId, string[]>>(initialLanes);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const tasksById = useMemo(() => Object.fromEntries(tasks.map((task) => [task.id, task])), []);

  const boardMetrics = useMemo(() => {
    const nowTasks = lanes.now.map((id) => tasksById[id]).filter(Boolean);
    const projectedLift = nowTasks.reduce((sum, task) => sum + task.impact * 8, 0);
    const riskLoad = nowTasks.reduce((sum, task) => sum + task.risk * 7, 0);
    const effortLoad = nowTasks.reduce((sum, task) => sum + task.effort * 6, 0);
    const focusPenalty = Math.max(0, nowTasks.length - 3) * 18;
    const executionScore = Math.max(0, projectedLift - riskLoad - effortLoad - focusPenalty);

    return {
      projectedLift,
      riskLoad,
      effortLoad,
      executionScore
    };
  }, [lanes.now, tasksById]);

  const handleDrop = (laneId: LaneId, taskId: string) => {
    setLanes((prev) => {
      const stripped = removeFromAllLanes(prev, taskId);
      return {
        ...stripped,
        [laneId]: [...stripped[laneId], taskId]
      };
    });
  };

  const autoPrioritize = () => {
    const ranked = [...tasks].sort((a, b) => scoreTask(b) - scoreTask(a));
    setLanes({
      now: ranked.slice(0, 2).map((task) => task.id),
      next: ranked.slice(2, 4).map((task) => task.id),
      later: ranked.slice(4).map((task) => task.id)
    });
  };

  const resetBoard = () => setLanes(initialLanes);

  return (
    <section className="surface priority-board">
      <p className="eyebrow">Bot Backlog Board</p>
      <h2>Drag my real bot tasks across lanes and watch execution strength move.</h2>
      <p>Each move shifts expected impact, risk load, and delivery pressure for the next release window.</p>

      <div className="button-row">
        <button className="chip" onClick={autoPrioritize} type="button">
          auto-prioritize
        </button>
        <button className="chip" onClick={resetBoard} type="button">
          reset board
        </button>
      </div>

      <div className="board-and-metrics">
        <div className="board-grid">
          {(Object.keys(laneTitles) as LaneId[]).map((laneId) => (
            <div
              key={laneId}
              className="board-lane"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const taskId = event.dataTransfer.getData("text/task-id");
                if (taskId) {
                  handleDrop(laneId, taskId);
                  setDraggingId(null);
                }
              }}
            >
              <div className="lane-head">
                <h3>{laneTitles[laneId]}</h3>
                <span>{lanes[laneId].length}</span>
              </div>
              <div className="lane-stack">
                {lanes[laneId].map((taskId) => {
                  const task = tasksById[taskId];
                  if (!task) {
                    return null;
                  }
                  return (
                    <article
                      key={task.id}
                      className={draggingId === task.id ? "task-card dragging" : "task-card"}
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.setData("text/task-id", task.id);
                        setDraggingId(task.id);
                      }}
                      onDragEnd={() => setDraggingId(null)}
                    >
                      <h4>{task.title}</h4>
                      <p>Impact {task.impact} · Effort {task.effort} · Risk {task.risk}</p>
                    </article>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <aside className="card board-metrics">
          <h3>Execution model</h3>
          <div className="metric-row">
            <span>Projected lift</span>
            <strong>{boardMetrics.projectedLift}</strong>
          </div>
          <div className="metric-row">
            <span>Risk load</span>
            <strong>{boardMetrics.riskLoad}</strong>
          </div>
          <div className="metric-row">
            <span>Effort load</span>
            <strong>{boardMetrics.effortLoad}</strong>
          </div>
          <div className="metric-row">
            <span>Execution score</span>
            <strong>{boardMetrics.executionScore}</strong>
          </div>
          <div className="meter">
            <div
              className="fill good"
              style={{ width: `${Math.min(100, Math.round(boardMetrics.executionScore / 2.4))}%` }}
            />
          </div>
          <p className="sim-reco">
            {boardMetrics.executionScore > 90
              ? "Current lane mix is strong: high upside, manageable risk."
              : "Rebalance now-lane scope before shipping to avoid churn."}
          </p>
        </aside>
      </div>
    </section>
  );
}
