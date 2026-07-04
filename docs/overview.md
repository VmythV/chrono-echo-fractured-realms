# Game Design Document

# Title
Chrono Echo: Fractured Realms

---

# 1. Game Overview

## Genre
Web-based Roguelike + Action Strategy + Meta Progression

## Core Concept
The world has been shattered by "time fractures." Each run enters a randomly generated timeline ruin—blending ancient, modern, futuristic, and corrupted realities.

You are not simply fighting through dungeons—you are interacting with broken timelines and shaping what reality becomes.

Inspired by:
- Slay the Spire (build diversity)
- Hades (fast roguelike loop)
- Rogue (procedural structure)

---

# 2. Core Gameplay Loop

## Single Run (10–15 minutes)

### Step 1: Enter Time Fracture
Randomly generated timeline environments:
- Ancient Temple (traps, curses)
- Modern City Collapse (gunfire, drones)
- Future Ruins (gravity shifts, energy beings)
- Corrupted Layer (rule-breaking anomalies)

---

### Step 2: Time Tree Map Exploration
Map is structured as branching nodes:
- Combat Nodes
- Event Nodes (time paradox events)
- Shop Nodes (time merchants)
- Memory Nodes (unlock abilities from past runs)
- Boss Nodes

---

### Step 3: Combat System
Hybrid system:
- 2D top-down or side view
- Skill-based + tactical pause selection
- Time-based skill cards

Core idea:
Players manipulate time during combat (pause, rewind, delay, duplicate actions).

---

# 3. Core Systems

## 3.1 Time Residue System (Core Innovation)

Runs are NOT reset completely.

Instead, each run leaves "time echoes":

- Previous abilities leave residual effects
- Past actions influence future runs

Examples:
- Using fire-heavy builds → future fire resistance increases, ice weakens
- Killing many NPCs → shops become more expensive
- Saving NPCs → beneficial paradox events appear later

---

## 3.2 Time Corruption System

A global instability meter:
- Higher corruption = stronger enemies
- Higher rewards (rare drops, unique enemies)
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
- Dash / blink
- Clone attack

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

Enemies are not static—they learn and adapt.

## Types:

### Time Error Entities
- Attack your previous death position
- Mimic your last build

### Historical Echoes
- Ancient generals that adapt to your tactics
- Future AI that predicts input patterns

### Rule Breakers
- UI manipulation enemies
- Input delay creatures

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
