# How To Play

# Chrono Echo: Fractured Realms

## 1. Goal

Each run is a short trip through a fractured timeline. Pick a route on the Time Tree, clear nodes, and defeat the Fracture Warden at the end. A run takes about 10 to 15 minutes. Losing is normal: every run leaves Time Residue that changes your next run.

## 2. Controls

| Input | Action |
| --- | --- |
| W A S D | Move |
| Mouse | Aim |
| Left click | Attack |
| Space | Dash (brief invulnerability) |
| Q | Time Freeze: freeze enemies and enemy shots near the cursor |
| E | Time Rewind: return to your position a few seconds ago and recover part of recent damage |
| R | Echo Attack (after unlocking it in the Memory Tree): fire a fan of three echo bolts. Also confirms result panels |
| F | Time Anchor (after unlocking it in the Memory Tree): place an anchor, press again to return to it |
| Esc | Pause during combat |

## 3. Run Flow

1. Main Menu: press `Start Run`. The Timeline State panel shows what your past runs left behind.
2. Time Tree: click a highlighted node to enter it. Node types: Combat, Elite, Event, Shop, Rest, Boss.
3. Combat: clear all enemies in the room. Winning grants Time Shards and a choice of one reward. Deeper rooms add the Anomaly, an enemy that blinks near you and fires after a short windup.
4. Event: a paradox event with two choices. Most pair a benefit with a cost; some cost shards.
5. Shop: spend Time Shards on priced rewards, or leave without buying.
6. Boss: defeat the Fracture Warden to complete the run. At 50 or more corruption the boss becomes the Glitch Warden, with ring barrages you must weave through.
7. Summary: review your build and the Time Residue this run generated, then return to the menu or start again.

## 4. Builds

Rewards come in three kinds:

- Skill Upgrades: make Time Freeze and Time Rewind stronger (wider freeze, freeze damage, rewind shield).
- Temporal Rules: passive combat rules, up to 5 slots per run. Rules can stack.
- Recovery: restore health.

Corrupted rewards appear when corruption is high: stronger effects with a corruption cost.

## 4b. Memory Tree

Every run earns Memories (1 per cleared node, +5 for winning). Spend them in the Memory Tree from the main menu to unlock permanent bonuses and two new active skills: Echo Attack (R) and Time Anchor (F). `Reset Save` also resets the Memory Tree.

## 5. Time Residue And Corruption

- Your actions generate Time Residue at the end of a run. Active residues modify the next runs and expire after a few runs.
- Corruption rises from risky choices. Higher corruption makes enemies stronger but improves reward quality. The Timeline Report on the map shows what is currently affecting your run.

## 6. Settings

The main menu `Settings` button opens the settings screen:

- Difficulty: Relaxed / Standard / Intense. Relaxed lowers enemy health and damage; Intense raises both. Applies from the next combat room.
- Language: English / 中文 / Español. All in-game text switches immediately.
- Sound: On / Off and Volume: Low / Normal / High.

Settings are stored locally and survive `Reset Save`. `Reset Save` clears residues, run history, and corruption records.

## 6b. Leaving And Returning

Your run is checkpointed every time you reach the Time Tree. If you close the tab or reload, the main menu offers `Continue Run`. Reloading during a combat, event, or shop returns you to the Time Tree from before that node. Dying ends the run for good.

## 7. Requirements

- A desktop browser with WebGL and JavaScript enabled (recent Chrome, Edge, Firefox, or Safari).
- Keyboard and mouse. Touch input is not supported in this version.
- All data stays in the browser via localStorage. No account or network is required.
