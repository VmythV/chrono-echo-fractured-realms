import Phaser from "phaser";
import "./styles.css";
import { CombatScene } from "./game/scenes/CombatScene";

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
  scene: [CombatScene]
};

new Phaser.Game(config);

