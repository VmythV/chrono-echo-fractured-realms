export type NodeType = "combat" | "elite" | "event" | "shop" | "rest" | "boss";

export type RunNode = {
  id: string;
  depth: number;
  lane: number;
  type: NodeType;
  label: string;
};

export type PlayerRunState = {
  health: number;
  maxHealth: number;
  attackDamageBonus: number;
  freezeCooldownReductionMs: number;
  rewindCooldownReductionMs: number;
};

export type RunState = {
  seed: string;
  currentDepth: number;
  selectedNodeIds: string[];
  completedNodeIds: string[];
  map: RunNode[][];
  bossNode: RunNode;
  player: PlayerRunState;
  rewardsTaken: string[];
  result: "running" | "won" | "lost";
  summaryReason: string;
};

export type RewardChoice = {
  id: string;
  title: string;
  description: string;
  apply: (state: RunState) => void;
};

