import type { Experiment } from "../types/content";

export const playgroundCategoryLabels: Record<Experiment["category"], string> = {
  motion: "timing",
  ui: "clarity",
  "ai-flow": "recovery",
  "3d": "weird"
};

export const playgroundStatusLabels: Record<Experiment["status"], string> = {
  shipped: "shipped",
  active: "still tuning",
  exploratory: "didn't ship"
};
