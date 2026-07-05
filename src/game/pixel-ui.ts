import Phaser from "phaser";

export const PIXEL_UI = {
  bg: 0x1a1c2c,
  panel: 0x29366f,
  panelDark: 0x1f2436,
  border: 0x566c86,
  borderLight: 0x94b0c2,
  accent: 0x41a6f6,
  accentBright: 0x73eff7,
  textMain: "#f4f4f4",
  textDim: "#94b0c2"
};

export function addScanlines(scene: Phaser.Scene): void {
  if (!scene.textures.exists("fx-scanline")) {
    const graphics = scene.add.graphics();
    graphics.fillStyle(0x000000, 0.4);
    graphics.fillRect(0, 2, 3, 1);
    graphics.generateTexture("fx-scanline", 3, 3);
    graphics.destroy();
  }

  const scanlines = scene.add.tileSprite(640, 360, 1280, 720, "fx-scanline");
  scanlines.setDepth(90);
  scanlines.setAlpha(0.45);
}

export type PixelButtonParts = {
  outer: Phaser.GameObjects.Rectangle;
  frame: Phaser.GameObjects.Rectangle;
  inner: Phaser.GameObjects.Rectangle;
};

export function drawPixelPanel(
  scene: Phaser.Scene,
  centerX: number,
  centerY: number,
  width: number,
  height: number,
  fill: number,
  border: number = PIXEL_UI.border
): PixelButtonParts {
  const outer = scene.add.rectangle(centerX, centerY, width + 8, height + 8, PIXEL_UI.bg);
  const frame = scene.add.rectangle(centerX, centerY, width + 4, height + 4, border);
  const inner = scene.add.rectangle(centerX, centerY, width, height, fill);
  return { outer, frame, inner };
}

export function makePixelButton(
  scene: Phaser.Scene,
  centerX: number,
  centerY: number,
  width: number,
  height: number,
  primary: boolean,
  onClick: () => void
): PixelButtonParts {
  const border = primary ? PIXEL_UI.accent : PIXEL_UI.border;
  const parts = drawPixelPanel(scene, centerX, centerY, width, height, primary ? PIXEL_UI.panel : PIXEL_UI.panelDark, border);
  parts.inner.setInteractive({ useHandCursor: true });
  parts.inner.on("pointerover", () => parts.frame.setFillStyle(PIXEL_UI.accentBright));
  parts.inner.on("pointerout", () => parts.frame.setFillStyle(border));
  parts.inner.on("pointerup", onClick);
  return parts;
}
