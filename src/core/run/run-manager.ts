import { getRewardById, getRewardChoices } from "./reward-catalog";
import type { NodeType, RewardChoice, RewardContext, RunNode, RunState } from "./run-state";

const ROUTE_DEPTHS = 7;
const NODE_LABELS: Record<NodeType, string> = {
  combat: "Combat",
  elite: "Elite",
  event: "Event",
  shop: "Shop",
  rest: "Rest",
  boss: "Boss"
};

const NODE_PATTERN: NodeType[][] = [
  ["combat", "event"],
  ["combat", "shop", "rest"],
  ["combat", "elite"],
  ["event", "combat", "rest"],
  ["combat", "shop", "elite"],
  ["combat", "event"],
  ["elite", "rest", "combat"]
];

let activeRun: RunState | null = null;

export function startNewRun(): RunState {
  const seed = `run-${Date.now()}`;
  const map = generateTimeTree();
  activeRun = {
    seed,
    currentDepth: 0,
    selectedNodeIds: [],
    completedNodeIds: [],
    map,
    bossNode: {
      id: "boss-0",
      depth: ROUTE_DEPTHS,
      lane: 0,
      type: "boss",
      label: "Fracture Warden"
    },
    player: {
      health: 100,
      maxHealth: 100,
      attackDamageBonus: 0,
      freezeCooldownReductionMs: 0,
      freezeImpactDamage: 0,
      freezeRadiusBonus: 0,
      rewindCooldownReductionMs: 0,
      rewindShieldDurationMs: 0
    },
    activeRules: [],
    rewardsTaken: [],
    result: "running",
    summaryReason: ""
  };

  return activeRun;
}

export function getRun(): RunState {
  if (!activeRun) {
    return startNewRun();
  }

  return activeRun;
}

export function getNodeById(nodeId: string): RunNode | undefined {
  const run = getRun();

  if (run.bossNode.id === nodeId) {
    return run.bossNode;
  }

  return run.map.flat().find((node) => node.id === nodeId);
}

export function getCurrentAvailableNodes(): RunNode[] {
  const run = getRun();

  if (run.currentDepth >= run.map.length) {
    return [run.bossNode];
  }

  return run.map[run.currentDepth] ?? [];
}

export function selectNode(nodeId: string): RunNode {
  const node = getNodeById(nodeId);

  if (!node) {
    throw new Error(`Unknown run node: ${nodeId}`);
  }

  const available = getCurrentAvailableNodes();
  if (!available.some((candidate) => candidate.id === nodeId)) {
    throw new Error(`Node is not available yet: ${nodeId}`);
  }

  return node;
}

export function completeNode(nodeId: string): void {
  const run = getRun();
  const node = getNodeById(nodeId);

  if (!node || run.completedNodeIds.includes(nodeId)) {
    return;
  }

  run.selectedNodeIds.push(nodeId);
  run.completedNodeIds.push(nodeId);

  if (node.type === "boss") {
    run.result = "won";
    run.summaryReason = "Fracture Warden defeated.";
    return;
  }

  run.currentDepth += 1;
}

export function failRun(reason: string): void {
  const run = getRun();
  run.result = "lost";
  run.summaryReason = reason;
}

export function setPlayerHealth(health: number): void {
  const run = getRun();
  run.player.health = Math.max(0, Math.min(run.player.maxHealth, Math.round(health)));
}

export function getRewards(context: RewardContext): RewardChoice[] {
  return getRewardChoices(context, getRun());
}

export function applyReward(rewardId: string, context: RewardContext): void {
  const run = getRun();
  const reward = getRewardById(rewardId, context, run);

  if (!reward) {
    throw new Error(`Unknown reward: ${rewardId}`);
  }

  reward.apply(run);
  run.rewardsTaken.push(rewardId);
}

function generateTimeTree(): RunNode[][] {
  return Array.from({ length: ROUTE_DEPTHS }, (_, depth) => {
    const pattern = NODE_PATTERN[depth] ?? ["combat", "event"];

    return pattern.map((type, lane) => ({
      id: `${depth}-${lane}-${type}`,
      depth,
      lane,
      type,
      label: NODE_LABELS[type]
    }));
  });
}
