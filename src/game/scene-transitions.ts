import Phaser from "phaser";

const FADE_RED = 16;
const FADE_GREEN = 21;
const FADE_BLUE = 28;

export function fadeInScene(scene: Phaser.Scene): void {
  scene.cameras.main.fadeIn(260, FADE_RED, FADE_GREEN, FADE_BLUE);
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
