import { t } from "../i18n";
import type { RunState } from "../run/run-state";

export type CorruptionTierId = "stable" | "unstable" | "fractured" | "critical";

export type CorruptionTier = {
  id: CorruptionTierId;
  min: number;
  enemyHealthMultiplier: number;
  enemyDamageBonus: number;
};

export const CORRUPTION_TIERS: CorruptionTier[] = [
  {
    id: "stable",
    min: 0,
    enemyHealthMultiplier: 1,
    enemyDamageBonus: 0
  },
  {
    id: "unstable",
    min: 25,
    enemyHealthMultiplier: 1.08,
    enemyDamageBonus: 1
  },
  {
    id: "fractured",
    min: 50,
    enemyHealthMultiplier: 1.16,
    enemyDamageBonus: 2
  },
  {
    id: "critical",
    min: 75,
    enemyHealthMultiplier: 1.25,
    enemyDamageBonus: 3
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

export function getCorruptionTierTitle(tier: CorruptionTier): string {
  return t(`corruption.${tier.id}`);
}

export function formatCorruptionState(corruption: number): string {
  const tier = getCorruptionTier(corruption);
  return t("corruption.state", { value: clampCorruption(corruption), tier: getCorruptionTierTitle(tier) });
}

export function formatCorruptionCombatEffect(corruption: number): string {
  const tier = getCorruptionTier(corruption);

  if (tier.id === "stable") {
    return t("corruption.stableEffect");
  }

  return t("corruption.effect", {
    multiplier: tier.enemyHealthMultiplier.toFixed(2),
    bonus: tier.enemyDamageBonus
  });
}

function clampCorruption(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}
