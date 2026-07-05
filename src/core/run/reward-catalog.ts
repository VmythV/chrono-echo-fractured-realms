import { addCorruption } from "../meta/corruption";
import type { RewardChoice, RewardContext, RunState, TemporalRuleId } from "./run-state";

export const MAX_TEMPORAL_RULES = 5;
export const MAX_TEMPORAL_RULE_STACKS = 2;

export const SHOP_PRICES: Record<RewardChoice["kind"], number> = {
  Recovery: 20,
  Upgrade: 30,
  Corrupted: 35,
  Rule: 45
};

type RewardDefinition = RewardChoice & {
  fallback?: boolean;
};

const REWARD_CATALOG: Record<string, RewardDefinition> = {
  sharpenedEcho: {
    id: "sharpenedEcho",
    kind: "Upgrade",
    title: "Sharpened Echo",
    description: "Basic attacks deal 4 more damage this run.",
    apply: (state) => {
      state.player.attackDamageBonus += 4;
    }
  },
  stableLoop: {
    id: "stableLoop",
    kind: "Recovery",
    title: "Stable Loop",
    description: "Heal 24 health.",
    apply: (state) => {
      state.player.health = Math.min(state.player.maxHealth, state.player.health + 24);
    },
    fallback: true
  },
  widerFreeze: {
    id: "widerFreeze",
    kind: "Upgrade",
    title: "Cold Focus",
    description: "Time Freeze cooldown is 1 second shorter this run.",
    apply: (state) => {
      state.player.freezeCooldownReductionMs += 1000;
    },
    fallback: true
  },
  widerField: {
    id: "widerField",
    kind: "Upgrade",
    title: "Wider Field",
    description: "Time Freeze radius is 42 pixels larger this run.",
    apply: (state) => {
      state.player.freezeRadiusBonus += 42;
    },
    fallback: true
  },
  coldMoment: {
    id: "coldMoment",
    kind: "Upgrade",
    title: "Cold Moment",
    description: "Time Freeze deals 10 damage to enemies it catches.",
    apply: (state) => {
      state.player.freezeImpactDamage += 10;
    },
    fallback: true
  },
  saferRecall: {
    id: "saferRecall",
    kind: "Upgrade",
    title: "Safer Recall",
    description: "Time Rewind cooldown is 1.5 seconds shorter this run.",
    apply: (state) => {
      state.player.rewindCooldownReductionMs += 1500;
    },
    fallback: true
  },
  borrowedBreath: {
    id: "borrowedBreath",
    kind: "Upgrade",
    title: "Borrowed Breath",
    description: "Time Rewind grants a one-hit shield for 1.2 seconds.",
    apply: (state) => {
      state.player.rewindShieldDurationMs += 1200;
    },
    fallback: true
  },
  vitalMemory: {
    id: "vitalMemory",
    kind: "Recovery",
    title: "Vital Memory",
    description: "Max health increases by 12 and you heal 12.",
    apply: (state) => {
      state.player.maxHealth += 12;
      state.player.health = Math.min(state.player.maxHealth, state.player.health + 12);
    },
    fallback: true
  },
  cleanRest: {
    id: "cleanRest",
    kind: "Recovery",
    title: "Clean Rest",
    description: "Heal 40 health.",
    apply: (state) => {
      state.player.health = Math.min(state.player.maxHealth, state.player.health + 40);
    },
    fallback: true
  },
  riskyCache: {
    id: "riskyCache",
    kind: "Upgrade",
    title: "Risky Cache",
    description: "Lose 8 health, then gain 8 attack damage this run.",
    apply: (state) => {
      state.player.health = Math.max(1, state.player.health - 8);
      state.player.attackDamageBonus += 8;
    }
  },
  fracturedEdge: {
    id: "fracturedEdge",
    kind: "Corrupted",
    title: "Fractured Edge",
    description: "Gain 10 attack damage this run. Corruption +18.",
    corruptionGain: 18,
    apply: (state) => {
      state.player.attackDamageBonus += 10;
      addCorruption(state, 18);
    }
  },
  voidCache: {
    id: "voidCache",
    kind: "Corrupted",
    title: "Void Cache",
    description: "Max health increases by 18 and you heal 18. Corruption +15.",
    corruptionGain: 15,
    apply: (state) => {
      state.player.maxHealth += 18;
      state.player.health = Math.min(state.player.maxHealth, state.player.health + 18);
      addCorruption(state, 15);
    }
  },
  merchantTune: {
    id: "merchantTune",
    kind: "Upgrade",
    title: "Merchant Tune",
    description: "Heal 16 and reduce both time skill cooldowns slightly.",
    apply: (state) => {
      state.player.health = Math.min(state.player.maxHealth, state.player.health + 16);
      state.player.freezeCooldownReductionMs += 500;
      state.player.rewindCooldownReductionMs += 500;
    },
    fallback: true
  },
  storedImpact: {
    id: "storedImpact",
    kind: "Rule",
    ruleId: "storedImpact",
    title: "Stored Impact",
    description: "Frozen enemies take 10 extra basic attack damage.",
    apply: (state) => {
      addTemporalRule(
        state,
        "storedImpact",
        "Stored Impact",
        "Frozen enemies take 10 extra basic attack damage."
      );
    }
  },
  splitSecond: {
    id: "splitSecond",
    kind: "Rule",
    ruleId: "splitSecond",
    title: "Split Second",
    description: "After Time Freeze or Time Rewind, your next basic attack deals 12 extra damage.",
    apply: (state) => {
      addTemporalRule(
        state,
        "splitSecond",
        "Split Second",
        "After Time Freeze or Time Rewind, your next basic attack deals 12 extra damage."
      );
    }
  },
  fastTimeline: {
    id: "fastTimeline",
    kind: "Rule",
    ruleId: "fastTimeline",
    title: "Fast Timeline",
    description: "Dashing immediately readies your basic attack.",
    apply: (state) => {
      addTemporalRule(
        state,
        "fastTimeline",
        "Fast Timeline",
        "Dashing immediately readies your basic attack."
      );
    }
  },
  emergencyLoop: {
    id: "emergencyLoop",
    kind: "Rule",
    ruleId: "emergencyLoop",
    title: "Emergency Loop",
    description: "At 35% health or lower, Time Rewind cooldown recovers faster.",
    apply: (state) => {
      addTemporalRule(
        state,
        "emergencyLoop",
        "Emergency Loop",
        "At 35% health or lower, Time Rewind cooldown recovers faster."
      );
    }
  }
};

const REWARD_POOLS: Record<RewardContext, string[]> = {
  combat: ["sharpenedEcho", "coldMoment", "storedImpact"],
  elite: ["fracturedEdge", "vitalMemory", "fastTimeline"],
  event: ["voidCache", "borrowedBreath", "splitSecond"],
  shop: ["merchantTune", "widerField", "saferRecall"],
  rest: ["cleanRest", "vitalMemory", "emergencyLoop"]
};

const FALLBACK_REWARD_IDS = Object.values(REWARD_CATALOG)
  .filter((reward) => reward.fallback)
  .map((reward) => reward.id);

export function getRewardChoices(context: RewardContext, state: RunState): RewardChoice[] {
  const selected = new Set<string>();
  const choices: RewardChoice[] = [];

  appendAvailableRewards(REWARD_POOLS[context], state, selected, choices);
  appendAvailableRewards(FALLBACK_REWARD_IDS, state, selected, choices);

  return choices.slice(0, 3);
}

export function getRewardById(rewardId: string, context: RewardContext, state: RunState): RewardChoice | undefined {
  return getRewardChoices(context, state).find((reward) => reward.id === rewardId);
}

export function getRuleSlotText(state: RunState): string {
  return `${state.activeRules.length}/${MAX_TEMPORAL_RULES}`;
}

function appendAvailableRewards(
  rewardIds: string[],
  state: RunState,
  selected: Set<string>,
  choices: RewardChoice[]
): void {
  rewardIds.forEach((rewardId) => {
    const reward = REWARD_CATALOG[rewardId];

    if (!reward || selected.has(reward.id) || !canOfferReward(reward, state)) {
      return;
    }

    selected.add(reward.id);
    choices.push(reward);
  });
}

function canOfferReward(reward: RewardDefinition, state: RunState): boolean {
  if (reward.kind !== "Rule" || !reward.ruleId) {
    return true;
  }

  const existingRule = state.activeRules.find((rule) => rule.id === reward.ruleId);

  if (existingRule) {
    return existingRule.stacks < MAX_TEMPORAL_RULE_STACKS;
  }

  return state.activeRules.length < MAX_TEMPORAL_RULES;
}

function addTemporalRule(state: RunState, id: TemporalRuleId, title: string, description: string): void {
  const existingRule = state.activeRules.find((rule) => rule.id === id);

  if (existingRule) {
    existingRule.stacks = Math.min(MAX_TEMPORAL_RULE_STACKS, existingRule.stacks + 1);
    return;
  }

  if (state.activeRules.length >= MAX_TEMPORAL_RULES) {
    return;
  }

  state.activeRules.push({
    id,
    title,
    description,
    stacks: 1
  });
}
