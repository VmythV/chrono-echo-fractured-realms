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

### Changed

- Updated the planned web runtime to Phaser `4.2.0`.
- Tuned the first combat room toward a lighter prototype difficulty.
- Moved Phaser scene runtime state reset into `init()` so replay starts from a clean state.
- Changed the game entry flow from direct combat prototype to Time Tree route selection.
