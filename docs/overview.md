# Game Design Document

# Title
Chrono Echo: Fractured Realms

---

# 0. Document Index

This overview records the high-level concept. Current executable design and planning details live in:

- `docs/game-design.md`: complete gameplay design and first-version scope
- `docs/development-plan.md`: staged execution plan and acceptance criteria
- `docs/technical-plan.md`: technical architecture and extensibility plan
- `docs/changelog.md`: project change history

---

# 1. Game Overview

## Genre
Web-based Roguelike + Top-down Action + Meta Progression

## Core Concept
The world has been shattered by "time fractures." Each run enters a short timeline ruin blending ancient, modern, futuristic, and corrupted realities.

You are not simply fighting through rooms. Your actions leave Time Residue, causing later runs to change in visible, lightweight ways.

Inspired by:
- Slay the Spire (build diversity)
- Hades (fast roguelike loop)
- Rogue (procedural structure)

---

# 2. Core Gameplay Loop

## Single Run (10 to 15 minutes)

### Step 1: Enter Time Fracture
Generated timeline environments:
- Ancient Temple (traps, curses)
- Modern City Collapse (gunfire, drones)
- Future Ruins (gravity shifts, energy beings)
- Corrupted Layer (high-risk anomaly rewards)

---

### Step 2: Time Tree Map Exploration
Map is structured as branching nodes:
- Combat Nodes
- Event Nodes (time paradox events)
- Shop Nodes (time merchants)
- Memory Nodes (unlock abilities from past runs)
- Rest Nodes
- Boss Nodes

---

### Step 3: Combat System
Real-time combat system:
- 2D top-down room battles
- Direct movement, aiming, basic attack, dash
- Two active time skills in the first version
- Reward choices happen between nodes, not through a complex in-combat card system

Core idea:
Players manipulate time during combat through readable actions such as freeze, rewind, delay, echo, and anchor effects.

---

# 3. Core Systems

## 3.1 Time Residue System (Core Innovation)

Runs are NOT reset completely.

Instead, each run leaves "time echoes":

- Previous abilities leave residual effects
- Past actions influence future runs

Examples:
- Frequent Time Freeze use leads to some enemy resistance, but also increases Freeze upgrade chances.
- High corruption creates Error Elite encounters, but improves rare reward chances.
- Saving NPCs makes beneficial paradox events appear later.

---

## 3.2 Time Corruption System

A global instability meter:
- Higher corruption = stronger enemies
- Higher rewards (rare upgrades, unique enemies)
- Introduces "error entities" (glitch bosses)

---

## 3.3 Memory-Based Progression

Instead of traditional leveling:

Players unlock "memories of history":
- Ancient sword techniques → melee combo system
- Future tech memory → energy shields / drones
- Death memory → unlock revival mechanics

---

# 4. Build System

Three-layer build design:

## Layer 1: Combat Skills
- Time freeze
- Time rewind
- Echo attack
- Time anchor

## Layer 2: Temporal Rules (Passive Modifiers)
- Delayed damage system
- Low HP increases damage
- Periodic time rollback effects

## Layer 3: Reality Modifiers (Meta Effects)
- Shop behavior changes
- NPC behavior changes
- Map structure changes

---

# 5. Enemy Design

Enemies are readable first, adaptive second.

## Types:

### Time Error Entities
- Attack your previous death position
- Mimic one visible behavior from your last run

### Historical Echoes
- Ancient generals that adapt to your tactics
- Future AI that predicts input patterns

### Rule Breakers
- Reserved for later experiments
- Not part of the first playable version

---

# 6. Technical Architecture (Web)

## Frontend
- Canvas engine: Phaser.js or PixiJS
- UI layer: React (optional)

## Core Modules
/game-core
  /time-engine        (time residue system)
  /combat-engine      (battle system)
  /map-generator      (time tree generation)
  /ai-enemy           (adaptive enemies)
  /meta-progression   (persistent systems)

---

# 7. Why This Works for Web

- Short session design (10–15 min runs)
- Strong replayability
- Lightweight rendering (2D canvas)
- High meta progression = strong retention
- Suitable for seasonal updates ("time fracture seasons")

---

# 8. Expansion Ideas

- Global timeline leaderboard
- Players affect each other's timelines
- Ghost runs (see other players' past failures)
- AI-generated timeline dungeons
- Seasonal "time collapse events"

---
