import Phaser from "phaser";
import "./styles.css";
import { GAME_HEIGHT, GAME_WIDTH, RENDER_SCALE } from "./game/display";
import { CombatScene } from "./game/scenes/CombatScene";
import { EventScene } from "./game/scenes/EventScene";
import { MainMenuScene } from "./game/scenes/MainMenuScene";
import { MapScene } from "./game/scenes/MapScene";
import { MemoryScene } from "./game/scenes/MemoryScene";
import { getRun } from "./core/run/run-manager";
import { RewardScene } from "./game/scenes/RewardScene";
import { SettingsScene } from "./game/scenes/SettingsScene";
import { SummaryScene } from "./game/scenes/SummaryScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.WEBGL,
  parent: "game-container",
  title: "Chrono Echo: Fractured Realms",
  backgroundColor: "#10151c",
  disableContextMenu: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH * RENDER_SCALE,
    height: GAME_HEIGHT * RENDER_SCALE
  },
  fps: {
    target: 60
  },
  input: {
    keyboard: true,
    mouse: true,
    touch: false,
    gamepad: false
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  scene: [MainMenuScene, SettingsScene, MemoryScene, MapScene, CombatScene, EventScene, RewardScene, SummaryScene]
};

function showErrorOverlay(message: string): void {
  if (document.getElementById("error-overlay")) {
    return;
  }

  const overlay = document.createElement("div");
  overlay.id = "error-overlay";

  const panel = document.createElement("div");
  panel.className = "error-panel";

  const title = document.createElement("h2");
  title.textContent = "Timeline Error";

  const body = document.createElement("p");
  body.textContent = message || "An unexpected error interrupted the game.";

  const reloadButton = document.createElement("button");
  reloadButton.textContent = "Reload";
  reloadButton.addEventListener("click", () => window.location.reload());

  const dismissButton = document.createElement("button");
  dismissButton.className = "secondary";
  dismissButton.textContent = "Dismiss";
  dismissButton.addEventListener("click", () => overlay.remove());

  panel.append(title, body, reloadButton, dismissButton);
  overlay.append(panel);
  document.body.append(overlay);
}

window.addEventListener("error", (event) => {
  showErrorOverlay(event.message);
});

window.addEventListener("unhandledrejection", (event) => {
  showErrorOverlay(event.reason instanceof Error ? event.reason.message : String(event.reason));
});

function patchTextDefaults(): void {
  // Phaser 4 has no game-wide text defaults. This patch gives every text object:
  // 1. resolution = RENDER_SCALE for crisp glyphs on high-DPI displays;
  // 2. useAdvancedWrap on wrapped text so CJK strings without spaces still break at width.
  const factory = Phaser.GameObjects.GameObjectFactory.prototype as unknown as {
    text: (x: number, y: number, text: string | string[], style?: Phaser.Types.GameObjects.Text.TextStyle) => Phaser.GameObjects.Text;
  };
  const baseText = factory.text;

  factory.text = function (this: unknown, x, y, text, style) {
    const merged: Phaser.Types.GameObjects.Text.TextStyle = {
      ...(RENDER_SCALE !== 1 ? { resolution: RENDER_SCALE } : {}),
      ...style
    };

    if (merged.wordWrap?.width && merged.wordWrap.useAdvancedWrap === undefined) {
      merged.wordWrap = { ...merged.wordWrap, useAdvancedWrap: true };
    }

    return baseText.call(this, x, y, text, merged);
  };
}

async function boot(): Promise<void> {
  try {
    await Promise.race([
      document.fonts.load('700 32px "Orbitron"'),
      new Promise((resolve) => setTimeout(resolve, 1500))
    ]);
  } catch {
    // The display font is optional; system fallbacks keep the game playable.
  }

  patchTextDefaults();
  const game = new Phaser.Game(config);

  game.events.once(Phaser.Core.Events.READY, () => {
    document.getElementById("boot-status")?.remove();
  });

  (window as Window & { __chronoEchoGame?: Phaser.Game }).__chronoEchoGame = game;
  (window as Window & { __chronoEchoDebug?: { getRun: typeof getRun } }).__chronoEchoDebug = { getRun };
}

void boot();
