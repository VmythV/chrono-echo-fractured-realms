import type { Difficulty } from "./settings";

export type DifficultyModifiers = {
  enemyHealthMultiplier: number;
  enemyDamageMultiplier: number;
};

const DIFFICULTY_MODIFIERS: Record<Difficulty, DifficultyModifiers> = {
  easy: {
    enemyHealthMultiplier: 0.8,
    enemyDamageMultiplier: 0.75
  },
  normal: {
    enemyHealthMultiplier: 1,
    enemyDamageMultiplier: 1
  },
  hard: {
    enemyHealthMultiplier: 1.25,
    enemyDamageMultiplier: 1.25
  }
};

export function getDifficultyModifiers(difficulty: Difficulty): DifficultyModifiers {
  return DIFFICULTY_MODIFIERS[difficulty];
}
