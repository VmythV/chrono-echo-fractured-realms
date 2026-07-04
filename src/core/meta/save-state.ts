import type { ResidueInstance } from "../run/run-state";

export type RunHistoryEntry = {
  seed: string;
  result: "won" | "lost";
  nodesCleared: number;
  rewardsTaken: number;
  generatedResidueIds: string[];
  endedAt: string;
};

export type SaveData = {
  version: 1;
  activeResidues: ResidueInstance[];
  runHistory: RunHistoryEntry[];
};

const SAVE_KEY = "chrono-echo-save-v1";
const MAX_RUN_HISTORY = 12;

export function loadSaveData(): SaveData {
  if (typeof window === "undefined") {
    return createDefaultSaveData();
  }

  try {
    const rawSave = window.localStorage.getItem(SAVE_KEY);

    if (!rawSave) {
      return createDefaultSaveData();
    }

    const parsed = JSON.parse(rawSave) as Partial<SaveData>;

    if (parsed.version !== 1 || !Array.isArray(parsed.activeResidues) || !Array.isArray(parsed.runHistory)) {
      return createDefaultSaveData();
    }

    return {
      version: 1,
      activeResidues: parsed.activeResidues,
      runHistory: parsed.runHistory.slice(0, MAX_RUN_HISTORY)
    };
  } catch {
    return createDefaultSaveData();
  }
}

export function saveSaveData(saveData: SaveData): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    SAVE_KEY,
    JSON.stringify({
      ...saveData,
      runHistory: saveData.runHistory.slice(0, MAX_RUN_HISTORY)
    })
  );
}

export function createRunHistoryEntry(
  seed: string,
  result: "won" | "lost",
  nodesCleared: number,
  rewardsTaken: number,
  generatedResidues: ResidueInstance[]
): RunHistoryEntry {
  return {
    seed,
    result,
    nodesCleared,
    rewardsTaken,
    generatedResidueIds: generatedResidues.map((residue) => residue.id),
    endedAt: new Date().toISOString()
  };
}

function createDefaultSaveData(): SaveData {
  return {
    version: 1,
    activeResidues: [],
    runHistory: []
  };
}
