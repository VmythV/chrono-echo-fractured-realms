import Phaser from "phaser";
import "./styles.css";
import { CombatScene } from "./game/scenes/CombatScene";
import { MainMenuScene } from "./game/scenes/MainMenuScene";
import { MapScene } from "./game/scenes/MapScene";
import { RewardScene } from "./game/scenes/RewardScene";
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
  scene: [MainMenuScene, MapScene, CombatScene, RewardScene, SummaryScene]
};

const game = new Phaser.Game(config);

if (import.meta.env.DEV) {
  (window as Window & { __chronoEchoGame?: Phaser.Game }).__chronoEchoGame = game;
}
