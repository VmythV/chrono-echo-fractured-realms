import type { RunState } from "../run/run-state";

export type CorruptionTierId = "stable" | "unstable" | "fractured" | "critical";

export type CorruptionTier = {
  id: CorruptionTierId;
  title: string;
  min: number;
  enemyHealthMultiplier: number;
  enemyDamageBonus: number;
  description: string;
};

export const CORRUPTION_TIERS: CorruptionTier[] = [
  {
    id: "stable",
    title: "Stable",
    min: 0,
    enemyHealthMultiplier: 1,
    enemyDamageBonus: 0,
    description: "No extra combat pressure."
  },
  {
    id: "unstable",
    title: "Unstable",
    min: 25,
    enemyHealthMultiplier: 1.08,
    enemyDamageBonus: 1,
    description: "Enemies gain 8% health and deal 1 extra damage."
  },
  {
    id: "fractured",
    title: "Fractured",
    min: 50,
    enemyHealthMultiplier: 1.16,
    enemyDamageBonus: 2,
    description: "Enemies gain 16% health and deal 2 extra damage."
  },
  {
    id: "critical",
    title: "Critical",
    min: 75,
    enemyHealthMultiplier: 1.25,
    enemyDamageBonus: 3,
    description: "Enemies gain 25% health and deal 3 extra damage."
  }
];

export function addCorruption(run: RunState, amount: number): void {
  run.corruption = clampCorruption(run.corruption + amount);
  run.counters.highestCorruption = Math.max(run.counters.highestCorruption, run.corruption);
}

export function getCorruptionTier(corruption: number): CorruptionTier {
  const value = clampCorruption(corruption);
  return [...CORRUPTION_TIERS].reverse().find((tier) => value >= tier.min) ?? CORRUPTION_TIERS[0];
}

export function formatCorruptionState(corruption: number): string {
  const tier = getCorruptionTier(corruption);
  return `${clampCorruption(corruption)}/100 ${tier.title}`;
}

export function formatCorruptionCombatEffect(corruption: number): string {
  const tier = getCorruptionTier(corruption);

  if (tier.id === "stable") {
    return tier.description;
  }

  return `Enemy health x${tier.enemyHealthMultiplier.toFixed(2)}, enemy damage +${tier.enemyDamageBonus}.`;
}

function clampCorruption(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}
