# Changelog

# Chrono Echo: Fractured Realms

## 2026-07-04

### Added

- Initialized Git repository.
- Added `AGENTS.md` with project collaboration, documentation, gameplay, visual, and Git rules.
- Added initial project overview in `docs/overview.md`.
- Added full gameplay design in `docs/game-design.md`.
- Added staged development plan in `docs/development-plan.md`.
- Added technical plan in `docs/technical-plan.md`.
- Added SVG core loop diagram in `docs/assets/core-loop.svg`.
- Added copied Phaser development skills under `.agents/skills`.
- Added Vite, TypeScript, and Phaser 4.2.0 project scaffold.
- Added first combat prototype scene.
- Added Stage 2 combat prototype execution record.
- Added combat readability polish with player bars, enemy health bars, hit feedback, freeze and rewind pulse effects, and a restartable result panel.
- Added Stage 3 run loop execution record.
- Added in-memory run state, time tree map, reward scene, summary scene, and Boss route completion.
- Added Stage 4 build-system execution record.
- Added RewardChoice type labels and active Temporal Rules in run state.
- Added the first four Temporal Rules: Stored Impact, Split Second, Fast Timeline, and Emergency Loop.
- Added Stage 4B reward catalog execution record.
- Added centralized reward catalog, rule slot limits, stack limits, and fallback reward selection.
- Added Stage 4C skill upgrade execution record.
- Added Wider Field, Cold Moment, and Borrowed Breath skill upgrades.
- Added Stage 5A Time Residue execution record.
- Added local save data, active residues, run history, and minimal residue generation.
- Added Stage 5B corruption execution record.
- Added corruption thresholds, Corrupted rewards, and Corrupted Signal residue.
- Added Stage 6A web shell execution record.
- Added MainMenuScene with local timeline summary and reset save action.

### Changed

- Updated the planned web runtime to Phaser `4.2.0`.
- Tuned the first combat room toward a lighter prototype difficulty.
- Moved Phaser scene runtime state reset into `init()` so replay starts from a clean state.
- Changed the game entry flow from direct combat prototype to Time Tree route selection.
- Changed RewardScene, MapScene, CombatScene, and SummaryScene to expose current build information.
- Changed reward selection so capped rules are filtered before being shown to the player.
- Changed CombatScene so Time Freeze and Time Rewind can read run-level skill upgrades.
- Changed MapScene and SummaryScene to show Timeline Report and generated residues.
- Changed CombatScene, MapScene, RewardScene, and SummaryScene to display or apply corruption state.
- Changed game startup flow to begin at MainMenuScene before creating a run.
