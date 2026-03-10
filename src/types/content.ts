export type Scenario = {
  id: string;
  title: string;
  prompt: string;
  response: string;
};

export type Experiment = {
  id: string;
  title: string;
  category: "motion" | "ui" | "ai-flow" | "3d";
  summary: string;
  question: string;
  result: string;
  appliedTo: string;
  status: "shipped" | "active" | "exploratory";
  controls: {
    a: string;
    b: string;
    flag: string;
  };
  signals: string[];
  tools: string[];
  featured?: boolean;
};

export type Tradeoff = {
  label: string;
  benefit: string;
  cost: string;
};

export type WorkCheckpoint = {
  stage: string;
  move: string;
  signal: string;
};

export type RuntimePanel = {
  title: string;
  broken: string;
  fixed: string;
};

export type WorkProofStat = {
  label: string;
  value: string;
};

export type CodeReceipt = {
  title: string;
  file: string;
  snippet: string;
};

export type WorkItem = {
  slug: string;
  title: string;
  liveUrl?: string;
  summary?: string;
  stack?: string[];
  context: string;
  demoHook: string;
  postmortem: string[];
  tradeoffs: Tradeoff[];
  checkpoints: WorkCheckpoint[];
  runtimePanels?: RuntimePanel[];
  proofStats?: WorkProofStat[];
  codeReceipts?: CodeReceipt[];
  architectureNotes?: string[];
  reliabilityNotes?: string[];
  featured?: boolean;
};

export type Gift = {
  id: string;
  title: string;
  recipient: string;
  problem: string;
  shipped: string;
  impact: string;
};

export type LogEntry = {
  id: string;
  date: string;
  build: string;
  learned: string;
  tools: string[];
  stage: "prototype" | "ship" | "iterate" | "systems";
  theme: "product" | "ux" | "ops" | "growth";
  impact?: string;
  proofLabel?: string;
  proofUrl?: string;
  hours?: number;
};
