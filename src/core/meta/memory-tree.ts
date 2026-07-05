import { loadSaveData, saveSaveData, type MemoryNodeId, type SaveData } from "./save-state";
import type { RunState } from "../run/run-state";

export type MemoryNode = {
  id: MemoryNodeId;
  cost: number;
  requires?: MemoryNodeId;
  apply: (run: RunState) => void;
};

export const MEMORY_TREE: MemoryNode[] = [
  {
    id: "vitality",
    cost: 10,
    apply: (run) => {
      run.player.maxHealth += 10;
      run.player.health += 10;
    }
  },
  {
    id: "sharpness",
    cost: 20,
    requires: "vitality",
    apply: (run) => {
      run.player.attackDamageBonus += 2;
    }
  },
  {
    id: "merchantPact",
    cost: 15,
    apply: (run) => {
      run.shards += 10;
    }
  },
  {
    id: "echoAttack",
    cost: 25,
    apply: (run) => {
      run.player.hasEchoAttack = true;
    }
  },
  {
    id: "timeAnchor",
    cost: 40,
    requires: "echoAttack",
    apply: (run) => {
      run.player.hasTimeAnchor = true;
    }
  }
];

export type MemoryNodeStatus = "unlocked" | "available" | "missingRequirement" | "notEnoughMemories";

export function getMemoryNodeStatus(node: MemoryNode, saveData: SaveData): MemoryNodeStatus {
  if (saveData.unlockedMemories.includes(node.id)) {
    return "unlocked";
  }

  if (node.requires && !saveData.unlockedMemories.includes(node.requires)) {
    return "missingRequirement";
  }

  return saveData.memories >= node.cost ? "available" : "notEnoughMemories";
}

export function unlockMemoryNode(nodeId: MemoryNodeId): boolean {
  const node = MEMORY_TREE.find((candidate) => candidate.id === nodeId);

  if (!node) {
    return false;
  }

  const saveData = loadSaveData();

  if (getMemoryNodeStatus(node, saveData) !== "available") {
    return false;
  }

  saveData.memories -= node.cost;
  saveData.unlockedMemories.push(node.id);
  saveSaveData(saveData);
  return true;
}

export function applyMemoriesToRun(run: RunState): void {
  const saveData = loadSaveData();

  MEMORY_TREE.forEach((node) => {
    if (saveData.unlockedMemories.includes(node.id)) {
      node.apply(run);
    }
  });
}

export function calculateRunMemories(run: RunState): number {
  return run.completedNodeIds.length + (run.result === "won" ? 5 : 0);
}
