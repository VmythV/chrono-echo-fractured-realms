import { addCorruption } from "../meta/corruption";
import type { RunNode, RunState } from "./run-state";

export type ParadoxEventId =
  | "temporalBargain"
  | "strandedEcho"
  | "unstableRift"
  | "forgottenCache"
  | "mirrorMoment";

export type ParadoxEventOption = {
  id: "a" | "b";
  shardCost: number;
  apply: (state: RunState) => void;
};

export type ParadoxEvent = {
  id: ParadoxEventId;
  options: [ParadoxEventOption, ParadoxEventOption];
};

const EVENT_ORDER: ParadoxEventId[] = [
  "temporalBargain",
  "strandedEcho",
  "unstableRift",
  "forgottenCache",
  "mirrorMoment"
];

const EVENT_CATALOG: Record<ParadoxEventId, ParadoxEvent> = {
  temporalBargain: {
    id: "temporalBargain",
    options: [
      {
        id: "a",
        shardCost: 0,
        apply: (state) => {
          state.player.attackDamageBonus += 8;
          addCorruption(state, 12);
        }
      },
      {
        id: "b",
        shardCost: 0,
        apply: (state) => {
          healPlayer(state, 20);
        }
      }
    ]
  },
  strandedEcho: {
    id: "strandedEcho",
    options: [
      {
        id: "a",
        shardCost: 15,
        apply: (state) => {
          state.player.maxHealth += 15;
          healPlayer(state, 15);
        }
      },
      {
        id: "b",
        shardCost: 0,
        apply: (state) => {
          state.shards += 10;
        }
      }
    ]
  },
  unstableRift: {
    id: "unstableRift",
    options: [
      {
        id: "a",
        shardCost: 0,
        apply: (state) => {
          state.player.freezeCooldownReductionMs += 1000;
          state.player.rewindCooldownReductionMs += 1000;
          addCorruption(state, 10);
        }
      },
      {
        id: "b",
        shardCost: 0,
        apply: (state) => {
          addCorruption(state, -12);
        }
      }
    ]
  },
  forgottenCache: {
    id: "forgottenCache",
    options: [
      {
        id: "a",
        shardCost: 0,
        apply: (state) => {
          state.shards += 25;
          addCorruption(state, 8);
        }
      },
      {
        id: "b",
        shardCost: 0,
        apply: (state) => {
          healPlayer(state, 10);
        }
      }
    ]
  },
  mirrorMoment: {
    id: "mirrorMoment",
    options: [
      {
        id: "a",
        shardCost: 0,
        apply: (state) => {
          state.player.freezeRadiusBonus += 30;
        }
      },
      {
        id: "b",
        shardCost: 0,
        apply: (state) => {
          state.player.rewindCooldownReductionMs += 1500;
        }
      }
    ]
  }
};

export function getEventForNode(node: RunNode): ParadoxEvent {
  return EVENT_CATALOG[EVENT_ORDER[(node.depth + node.lane) % EVENT_ORDER.length]];
}

export function canChooseEventOption(option: ParadoxEventOption, state: RunState): boolean {
  return state.shards >= option.shardCost;
}

export function applyEventOption(event: ParadoxEvent, optionId: "a" | "b", state: RunState): void {
  const option = event.options.find((candidate) => candidate.id === optionId);

  if (!option || !canChooseEventOption(option, state)) {
    return;
  }

  state.shards -= option.shardCost;
  option.apply(state);
}

function healPlayer(state: RunState, amount: number): void {
  state.player.health = Math.min(state.player.maxHealth, state.player.health + amount);
}
