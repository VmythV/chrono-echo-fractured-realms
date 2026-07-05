import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH, RENDER_SCALE } from "./display";
import { addScanlines } from "./pixel-ui";

const FADE_RED = 16;
const FADE_GREEN = 21;
const FADE_BLUE = 28;

export function fadeInScene(scene: Phaser.Scene): void {
  const camera = scene.cameras.main;

  if (RENDER_SCALE !== 1) {
    camera.setZoom(RENDER_SCALE);
    camera.centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
  }

  camera.fadeIn(260, FADE_RED, FADE_GREEN, FADE_BLUE);
  addScanlines(scene);
}

export function transitionTo(scene: Phaser.Scene, key: string, data?: object): void {
  const camera = scene.cameras.main;

  if (camera.fadeEffect.isRunning) {
    return;
  }

  camera.fadeOut(200, FADE_RED, FADE_GREEN, FADE_BLUE);
  camera.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
    scene.scene.start(key, data);
  });
}
