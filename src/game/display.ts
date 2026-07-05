export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

export const RENDER_SCALE = Math.min(
  typeof window !== "undefined" ? Math.ceil(window.devicePixelRatio || 1) : 1,
  2
);

export const DISPLAY_FONT = '"Press Start 2P", "Orbitron", Inter, Arial, sans-serif';
export const BODY_FONT = "Inter, Arial, sans-serif";
