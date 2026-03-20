import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ExperimentFilterBar } from "../src/components/playground/ExperimentFilterBar";
import { LogEntryList } from "../src/components/lab/LogEntryList";
import type { LogEntry } from "../src/types/content";

const logEntries: LogEntry[] = [
  {
    id: "log-1",
    date: "2026-03-19",
    build: "Added route metadata generation",
    learned: "Crawler-visible metadata needs static HTML.",
    tools: ["Vite", "React"],
    stage: "ship",
    theme: "product",
    hours: 3
  }
];

describe("control accessibility", () => {
  it("exposes pressed state for experiment category filters", () => {
    render(
      <ExperimentFilterBar
        active="ui"
        categories={["ui", "motion"]}
        onSelect={() => undefined}
      />
    );

    expect(screen.getByRole("button", { name: "ui" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "motion" })).toHaveAttribute("aria-pressed", "false");
  });

  it("labels the log tool filter and exposes toggle state", () => {
    render(<LogEntryList entries={logEntries} />);

    expect(screen.getByLabelText("Filter log entries by tool")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "all themes" })).toHaveAttribute("aria-pressed", "true");
  });
});
