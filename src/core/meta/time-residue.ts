import { t } from "../i18n";
import { calculateRunMemories } from "./memory-tree";
import { createRunHistoryEntry, loadSaveData, saveSaveData } from "./save-state";
import type { ResidueId, ResidueInstance, RunState } from "../run/run-state";

type ResidueDefinition = {
  id: ResidueId;
  title: string;
  description: string;
  durationRuns: number;
  apply: (run: RunState, stacks: number) => void;
};

const MAX_GENERATED_RESIDUES = 3;
const MAX_RESIDUE_STACKS = 2;

const RESIDUE_DEFINITIONS: Record<ResidueId, ResidueDefinition> = {
  victoryEcho: {
    id: "victoryEcho",
    title: "Victory Echo",
    description: "Next run starts with 4 extra attack damage.",
    durationRuns: 1,
    apply: (run, stacks) => {
      run.player.attackDamageBonus += 4 * stacks;
    }
  },
  lastStandMemory: {
    id: "lastStandMemory",
    title: "Last Stand Memory",
    description: "Next run starts with 12 extra max health.",
    durationRuns: 1,
    apply: (run, stacks) => {
      const bonusHealth = 12 * stacks;
      run.player.maxHealth += bonusHealth;
      run.player.health += bonusHealth;
    }
  },
  frozenTimeline: {
    id: "frozenTimeline",
    title: "Frozen Timeline",
    description: "Next runs start with Time Freeze cooldown 0.5 seconds shorter.",
    durationRuns: 2,
    apply: (run, stacks) => {
      run.player.freezeCooldownReductionMs += 500 * stacks;
    }
  },
  recallTrace: {
    id: "recallTrace",
    title: "Recall Trace",
    description: "Next runs start with Time Rewind cooldown 0.5 seconds shorter.",
    durationRuns: 2,
    apply: (run, stacks) => {
      run.player.rewindCooldownReductionMs += 500 * stacks;
    }
  },
  merchantMemory: {
    id: "merchantMemory",
    title: "Merchant Memory",
    description: "Next runs start with 6 extra max health.",
    durationRuns: 2,
    apply: (run, stacks) => {
      const bonusHealth = 6 * stacks;
      run.player.maxHealth += bonusHealth;
      run.player.health += bonusHealth;
    }
  },
  corruptedSignal: {
    id: "corruptedSignal",
    title: "Corrupted Signal",
    description: "Next run starts with 6 extra attack damage.",
    durationRuns: 1,
    apply: (run, stacks) => {
      run.player.attackDamageBonus += 6 * stacks;
    }
  },
  shardMemory: {
    id: "shardMemory",
    title: "Shard Memory",
    description: "Next run starts with 20 shards.",
    durationRuns: 1,
    apply: (run, stacks) => {
      run.shards += 20 * stacks;
    }
  },
  eliteTrophy: {
    id: "eliteTrophy",
    title: "Elite Trophy",
    description: "Next run starts with 8 extra max health.",
    durationRuns: 1,
    apply: (run, stacks) => {
      const bonusHealth = 8 * stacks;
      run.player.maxHealth += bonusHealth;
      run.player.health += bonusHealth;
    }
  },
  overclockedFreeze: {
    id: "overclockedFreeze",
    title: "Overclocked Freeze",
    description: "Next runs: Time Freeze cooldown -1 second, freeze duration -0.3 seconds.",
    durationRuns: 2,
    apply: (run, stacks) => {
      run.player.freezeCooldownReductionMs += 1000 * stacks;
      run.player.freezeDurationBonusMs -= 300 * stacks;
    }
  }
};

export function consumeResiduesForRun(run: RunState): void {
  const saveData = loadSaveData();
  const activeResidues = saveData.activeResidues.filter((residue) => residue.remainingRuns > 0);

  run.appliedResidues = activeResidues.map(cloneResidue);
  run.appliedResidues.forEach((residue) => {
    RESIDUE_DEFINITIONS[residue.id]?.apply(run, residue.stacks);
  });

  saveData.activeResidues = activeResidues
    .map((residue) => ({
      ...residue,
      remainingRuns: residue.remainingRuns - 1
    }))
    .filter((residue) => residue.remainingRuns > 0);
  saveSaveData(saveData);
}

export function finalizeRunResidues(run: RunState): ResidueInstance[] {
  if (run.summaryRecorded) {
    return run.generatedResidues;
  }

  const generatedResidues = generateResidues(run);
  const saveData = loadSaveData();

  generatedResidues.forEach((residue) => {
    const existingResidue = saveData.activeResidues.find((candidate) => candidate.id === residue.id);

    if (existingResidue) {
      existingResidue.remainingRuns = Math.max(existingResidue.remainingRuns, residue.remainingRuns);
      existingResidue.stacks = Math.min(MAX_RESIDUE_STACKS, existingResidue.stacks + residue.stacks);
      return;
    }

    saveData.activeResidues.push(cloneResidue(residue));
  });

  saveData.runHistory.unshift(
    createRunHistoryEntry(
      run.seed,
      run.result === "won" ? "won" : "lost",
      run.completedNodeIds.length,
      run.rewardsTaken.length,
      run.corruption,
      generatedResidues
    )
  );
  saveData.lastRunCorruption = run.corruption;
  saveData.highestCorruption = Math.max(saveData.highestCorruption, run.counters.highestCorruption, run.corruption);
  run.memoriesEarned = calculateRunMemories(run);
  saveData.memories += run.memoriesEarned;
  saveSaveData(saveData);

  run.generatedResidues = generatedResidues;
  run.summaryRecorded = true;

  return run.generatedResidues;
}

export function formatResidues(residues: ResidueInstance[]): string {
  if (residues.length === 0) {
    return t("common.none");
  }

  return residues
    .map((residue) => {
      const stacks = residue.stacks > 1 ? ` x${residue.stacks}` : "";
      return `${getResidueTitle(residue)}${stacks}`;
    })
    .join(" / ");
}

export function getResidueTitle(residue: ResidueInstance): string {
  return t(`residue.${residue.id}.title`);
}

export function getResidueDescription(residue: ResidueInstance): string {
  return t(`residue.${residue.id}.desc`);
}

function generateResidues(run: RunState): ResidueInstance[] {
  const residueIds: ResidueId[] = [];

  if (run.result === "won") {
    residueIds.push("victoryEcho");
  } else {
    residueIds.push("lastStandMemory");
  }

  if (run.corruption >= 50) {
    residueIds.push("corruptedSignal");
  }

  if (run.shards >= 30) {
    residueIds.push("shardMemory");
  }

  if (run.counters.elitesDefeated >= 2) {
    residueIds.push("eliteTrophy");
  }

  if (run.counters.timeFreezeCasts >= 5) {
    residueIds.push("overclockedFreeze");
  }

  if (run.counters.timeFreezeCasts >= 2) {
    residueIds.push("frozenTimeline");
  }

  if (run.counters.timeRewindCasts >= 1) {
    residueIds.push("recallTrace");
  }

  if (run.counters.shopsVisited >= 1) {
    residueIds.push("merchantMemory");
  }

  return residueIds.slice(0, MAX_GENERATED_RESIDUES).map(createResidueInstance);
}

function createResidueInstance(id: ResidueId): ResidueInstance {
  const definition = RESIDUE_DEFINITIONS[id];

  return {
    id,
    title: definition.title,
    description: definition.description,
    remainingRuns: definition.durationRuns,
    stacks: 1
  };
}

function cloneResidue(residue: ResidueInstance): ResidueInstance {
  return {
    ...residue
  };
}
