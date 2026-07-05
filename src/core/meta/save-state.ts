import type { ResidueInstance } from "../run/run-state";

export type MemoryNodeId = "vitality" | "sharpness" | "merchantPact" | "echoAttack" | "timeAnchor";

const MEMORY_NODE_IDS: MemoryNodeId[] = ["vitality", "sharpness", "merchantPact", "echoAttack", "timeAnchor"];

export type RunHistoryEntry = {
  seed: string;
  result: "won" | "lost";
  nodesCleared: number;
  rewardsTaken: number;
  corruption: number;
  generatedResidueIds: string[];
  endedAt: string;
};

export type SaveData = {
  version: 1;
  activeResidues: ResidueInstance[];
  runHistory: RunHistoryEntry[];
  highestCorruption: number;
  lastRunCorruption: number;
  memories: number;
  unlockedMemories: MemoryNodeId[];
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
      runHistory: parsed.runHistory.slice(0, MAX_RUN_HISTORY).map(normalizeRunHistoryEntry),
      highestCorruption: normalizeCorruptionValue(parsed.highestCorruption),
      lastRunCorruption: normalizeCorruptionValue(parsed.lastRunCorruption),
      memories: typeof parsed.memories === "number" ? Math.max(0, Math.round(parsed.memories)) : 0,
      unlockedMemories: Array.isArray(parsed.unlockedMemories)
        ? parsed.unlockedMemories.filter((id): id is MemoryNodeId => MEMORY_NODE_IDS.includes(id as MemoryNodeId))
        : []
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

export function clearSaveData(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(SAVE_KEY);
}

export function createRunHistoryEntry(
  seed: string,
  result: "won" | "lost",
  nodesCleared: number,
  rewardsTaken: number,
  corruption: number,
  generatedResidues: ResidueInstance[]
): RunHistoryEntry {
  return {
    seed,
    result,
    nodesCleared,
    rewardsTaken,
    corruption: normalizeCorruptionValue(corruption),
    generatedResidueIds: generatedResidues.map((residue) => residue.id),
    endedAt: new Date().toISOString()
  };
}

function createDefaultSaveData(): SaveData {
  return {
    version: 1,
    activeResidues: [],
    runHistory: [],
    highestCorruption: 0,
    lastRunCorruption: 0,
    memories: 0,
    unlockedMemories: []
  };
}

function normalizeRunHistoryEntry(entry: Partial<RunHistoryEntry>): RunHistoryEntry {
  return {
    seed: entry.seed ?? "unknown",
    result: entry.result === "won" ? "won" : "lost",
    nodesCleared: typeof entry.nodesCleared === "number" ? entry.nodesCleared : 0,
    rewardsTaken: typeof entry.rewardsTaken === "number" ? entry.rewardsTaken : 0,
    corruption: normalizeCorruptionValue(entry.corruption),
    generatedResidueIds: Array.isArray(entry.generatedResidueIds) ? entry.generatedResidueIds : [],
    endedAt: entry.endedAt ?? new Date().toISOString()
  };
}

function normalizeCorruptionValue(value: unknown): number {
  return typeof value === "number" ? Math.max(0, Math.min(100, Math.round(value))) : 0;
}
