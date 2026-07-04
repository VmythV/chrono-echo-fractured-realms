export type NodeType = "combat" | "elite" | "event" | "shop" | "rest" | "boss";
export type RewardKind = "Upgrade" | "Rule" | "Recovery";
export type RewardContext = "combat" | "elite" | "event" | "shop" | "rest";
export type TemporalRuleId = "storedImpact" | "splitSecond" | "fastTimeline" | "emergencyLoop";

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
  freezeImpactDamage: number;
  freezeRadiusBonus: number;
  rewindCooldownReductionMs: number;
  rewindShieldDurationMs: number;
};

export type RunState = {
  seed: string;
  currentDepth: number;
  selectedNodeIds: string[];
  completedNodeIds: string[];
  map: RunNode[][];
  bossNode: RunNode;
  player: PlayerRunState;
  activeRules: TemporalRuleInstance[];
  rewardsTaken: string[];
  result: "running" | "won" | "lost";
  summaryReason: string;
};

export type RewardChoice = {
  id: string;
  kind: RewardKind;
  ruleId?: TemporalRuleId;
  title: string;
  description: string;
  apply: (state: RunState) => void;
};

export type TemporalRuleInstance = {
  id: TemporalRuleId;
  title: string;
  description: string;
  stacks: number;
};
