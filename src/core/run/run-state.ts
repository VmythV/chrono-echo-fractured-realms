export type NodeType = "combat" | "elite" | "event" | "shop" | "rest" | "boss";
export type RewardKind = "Upgrade" | "Rule" | "Recovery" | "Corrupted";
export type RewardContext = "combat" | "elite" | "event" | "shop" | "rest";
export type TemporalRuleId = "storedImpact" | "splitSecond" | "fastTimeline" | "emergencyLoop";
export type ResidueId =
  | "victoryEcho"
  | "lastStandMemory"
  | "frozenTimeline"
  | "recallTrace"
  | "merchantMemory"
  | "corruptedSignal";

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
  corruption: number;
  activeRules: TemporalRuleInstance[];
  appliedResidues: ResidueInstance[];
  generatedResidues: ResidueInstance[];
  counters: RunCounters;
  rewardsTaken: string[];
  result: "running" | "won" | "lost";
  summaryReason: string;
  summaryRecorded: boolean;
};

export type RewardChoice = {
  id: string;
  kind: RewardKind;
  ruleId?: TemporalRuleId;
  title: string;
  description: string;
  corruptionGain?: number;
  apply: (state: RunState) => void;
};

export type TemporalRuleInstance = {
  id: TemporalRuleId;
  title: string;
  description: string;
  stacks: number;
};

export type ResidueInstance = {
  id: ResidueId;
  title: string;
  description: string;
  remainingRuns: number;
  stacks: number;
};

export type RunCounters = {
  timeFreezeCasts: number;
  timeRewindCasts: number;
  shopsVisited: number;
  eventsVisited: number;
  elitesDefeated: number;
  combatsCleared: number;
  bossDefeated: boolean;
  highestCorruption: number;
};
