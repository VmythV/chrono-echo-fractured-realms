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
- Added Stage 6B settings and audio execution record.
- Added local settings storage with sound toggle and volume steps.
- Added runtime-synthesized sound effects for UI clicks, combat actions, time skills, and run results.
- Added main menu Sound and Volume buttons.
- Added Stage 6C playable build execution record.
- Added boot loading indicator, noscript notice, and global error overlay with reload and dismiss actions.
- Added main menu controls hint.
- Added player guide in `docs/how-to-play.md`.
- Added Stage 7A settings, difficulty, and language execution record.
- Added SettingsScene with difficulty, language, sound, and volume controls.
- Added three difficulty levels that scale enemy health and damage.
- Added an i18n module with full English, Chinese, and Spanish translations for all player-facing text.
- Added Stage 7B events and economy execution record.
- Added Time Shards currency earned from combat wins and shown on map, event, shop, and summary screens.
- Added EventScene with the first five paradox events offering benefit-plus-cost choices.
- Added shop pricing with per-kind prices, disabled unaffordable cards, and a Leave button.
- Added Stage 7C combat content execution record.
- Added the Anomaly enemy that blinks near the player and fires after a short windup.
- Added the Glitch Warden boss variant that appears at 50 or more corruption with ring and burst attacks.
- Added Shard Memory, Elite Trophy, and Overclocked Freeze residues.
- Added a `freezeDurationBonusMs` player stat so residues can modify Time Freeze duration.
- Added a `window.__chronoEchoDebug` handle for automated run-state verification.
- Added Stage 8 memory tree execution record.
- Added Memories meta currency earned at run end and shown in the menu, memory tree, and summary.
- Added MemoryScene with five permanent unlock nodes across three branches.
- Added the Echo Attack (R) and Time Anchor (F) unlockable active skills with sounds and HUD rows.
- Added Stage 9A run persistence and pause execution record.
- Added run snapshots saved at the time tree with a Continue Run entry on the main menu.
- Added an ESC pause panel in combat with resume and main menu actions.
- Added Stage 9B smoke tests execution record and `docs/testing.md`.
- Added a committed Playwright smoke suite in `tests/e2e-smoke.mjs` with an `npm run test:e2e` script.
- Added Stage 10A visual identity execution record.
- Added timeline-themed arenas (Ancient, City, Future, Corrupted) with ambient drifting particles.
- Added glow-baked shapes for the player, all enemies, both boss variants, and projectiles.
- Added an aim direction arrow, rotating bolt projectiles, hit and break particle bursts, and dash afterimages.
- Added a breathing pulse on available time tree nodes with stroke-based hover.

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
- Changed CombatScene to add a light camera shake when the player takes damage.
- Changed Vite base to `./` so the packaged build runs from any static path.
- Changed the `__chronoEchoGame` debug handle to be exposed in packaged builds for automated verification.
- Changed the main menu Sound and Volume buttons into a Settings entry that opens SettingsScene.
- Changed residue, rule, corruption, and node text rendering to translate by id so saved data never shows a stale language.
