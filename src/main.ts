import Phaser from "phaser";
import "./styles.css";
import { CombatScene } from "./game/scenes/CombatScene";
import { EventScene } from "./game/scenes/EventScene";
import { MainMenuScene } from "./game/scenes/MainMenuScene";
import { MapScene } from "./game/scenes/MapScene";
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
    width: 1280,
    height: 720
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
  scene: [MainMenuScene, SettingsScene, MapScene, CombatScene, EventScene, RewardScene, SummaryScene]
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

const game = new Phaser.Game(config);

game.events.once(Phaser.Core.Events.READY, () => {
  document.getElementById("boot-status")?.remove();
});

(window as Window & { __chronoEchoGame?: Phaser.Game }).__chronoEchoGame = game;
(window as Window & { __chronoEchoDebug?: { getRun: typeof getRun } }).__chronoEchoDebug = { getRun };
