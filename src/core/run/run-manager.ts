import type { NodeType, RewardChoice, RunNode, RunState } from "./run-state";

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
      rewindCooldownReductionMs: 0
    },
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

export function getRewards(context: "combat" | "elite" | "event" | "shop" | "rest"): RewardChoice[] {
  const rewards: Record<string, RewardChoice> = {
    sharpenedEcho: {
      id: "sharpenedEcho",
      title: "Sharpened Echo",
      description: "Basic attacks deal 4 more damage this run.",
      apply: (state) => {
        state.player.attackDamageBonus += 4;
      }
    },
    stableLoop: {
      id: "stableLoop",
      title: "Stable Loop",
      description: "Heal 24 health.",
      apply: (state) => {
        state.player.health = Math.min(state.player.maxHealth, state.player.health + 24);
      }
    },
    widerFreeze: {
      id: "widerFreeze",
      title: "Cold Focus",
      description: "Time Freeze cooldown is 1 second shorter this run.",
      apply: (state) => {
        state.player.freezeCooldownReductionMs += 1000;
      }
    },
    saferRecall: {
      id: "saferRecall",
      title: "Safer Recall",
      description: "Time Rewind cooldown is 1.5 seconds shorter this run.",
      apply: (state) => {
        state.player.rewindCooldownReductionMs += 1500;
      }
    },
    vitalMemory: {
      id: "vitalMemory",
      title: "Vital Memory",
      description: "Max health increases by 12 and you heal 12.",
      apply: (state) => {
        state.player.maxHealth += 12;
        state.player.health = Math.min(state.player.maxHealth, state.player.health + 12);
      }
    },
    cleanRest: {
      id: "cleanRest",
      title: "Clean Rest",
      description: "Heal 40 health.",
      apply: (state) => {
        state.player.health = Math.min(state.player.maxHealth, state.player.health + 40);
      }
    },
    riskyCache: {
      id: "riskyCache",
      title: "Risky Cache",
      description: "Lose 8 health, then gain 8 attack damage this run.",
      apply: (state) => {
        state.player.health = Math.max(1, state.player.health - 8);
        state.player.attackDamageBonus += 8;
      }
    },
    merchantTune: {
      id: "merchantTune",
      title: "Merchant Tune",
      description: "Heal 16 and reduce both time skill cooldowns slightly.",
      apply: (state) => {
        state.player.health = Math.min(state.player.maxHealth, state.player.health + 16);
        state.player.freezeCooldownReductionMs += 500;
        state.player.rewindCooldownReductionMs += 500;
      }
    }
  };

  const pools: Record<typeof context, RewardChoice[]> = {
    combat: [rewards.sharpenedEcho, rewards.stableLoop, rewards.widerFreeze],
    elite: [rewards.vitalMemory, rewards.sharpenedEcho, rewards.saferRecall],
    event: [rewards.riskyCache, rewards.stableLoop, rewards.widerFreeze],
    shop: [rewards.merchantTune, rewards.sharpenedEcho, rewards.saferRecall],
    rest: [rewards.cleanRest, rewards.vitalMemory, rewards.stableLoop]
  };

  return pools[context];
}

export function applyReward(rewardId: string, context: "combat" | "elite" | "event" | "shop" | "rest"): void {
  const run = getRun();
  const reward = getRewards(context).find((choice) => choice.id === rewardId);

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

