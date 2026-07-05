import { loadSettings } from "../../core/meta/settings";

export type SfxName =
  | "uiClick"
  | "playerShot"
  | "playerHurt"
  | "shieldBlock"
  | "dash"
  | "blink"
  | "enemyHit"
  | "enemyBreak"
  | "freeze"
  | "rewind"
  | "victory"
  | "defeat";

type ToneSpec = {
  wave: OscillatorType;
  startFreq: number;
  endFreq: number;
  durationMs: number;
  peak: number;
  delayMs?: number;
};

const SFX_LIBRARY: Record<SfxName, ToneSpec[]> = {
  uiClick: [{ wave: "triangle", startFreq: 640, endFreq: 500, durationMs: 70, peak: 0.22 }],
  playerShot: [{ wave: "square", startFreq: 860, endFreq: 430, durationMs: 90, peak: 0.1 }],
  playerHurt: [{ wave: "sawtooth", startFreq: 220, endFreq: 90, durationMs: 220, peak: 0.28 }],
  shieldBlock: [{ wave: "triangle", startFreq: 520, endFreq: 780, durationMs: 150, peak: 0.22 }],
  dash: [{ wave: "sine", startFreq: 330, endFreq: 750, durationMs: 120, peak: 0.16 }],
  blink: [
    { wave: "sine", startFreq: 700, endFreq: 240, durationMs: 110, peak: 0.12 },
    { wave: "sine", startFreq: 240, endFreq: 700, durationMs: 110, peak: 0.12, delayMs: 110 }
  ],
  enemyHit: [{ wave: "triangle", startFreq: 310, endFreq: 190, durationMs: 100, peak: 0.2 }],
  enemyBreak: [
    { wave: "sawtooth", startFreq: 420, endFreq: 60, durationMs: 280, peak: 0.24 },
    { wave: "triangle", startFreq: 840, endFreq: 120, durationMs: 200, peak: 0.12 }
  ],
  freeze: [
    { wave: "sine", startFreq: 940, endFreq: 260, durationMs: 400, peak: 0.22 },
    { wave: "sine", startFreq: 1410, endFreq: 390, durationMs: 400, peak: 0.1 }
  ],
  rewind: [{ wave: "sine", startFreq: 240, endFreq: 960, durationMs: 380, peak: 0.2 }],
  victory: [
    { wave: "triangle", startFreq: 523, endFreq: 523, durationMs: 130, peak: 0.2 },
    { wave: "triangle", startFreq: 659, endFreq: 659, durationMs: 130, peak: 0.2, delayMs: 130 },
    { wave: "triangle", startFreq: 784, endFreq: 784, durationMs: 240, peak: 0.22, delayMs: 260 }
  ],
  defeat: [
    { wave: "sawtooth", startFreq: 392, endFreq: 392, durationMs: 200, peak: 0.16 },
    { wave: "sawtooth", startFreq: 311, endFreq: 311, durationMs: 220, peak: 0.16, delayMs: 190 },
    { wave: "sawtooth", startFreq: 196, endFreq: 150, durationMs: 420, peak: 0.18, delayMs: 400 }
  ]
};

let audioContext: AudioContext | null = null;
let contextUnavailable = false;

export function playSfx(name: SfxName): void {
  const settings = loadSettings();

  if (!settings.sfxEnabled) {
    return;
  }

  const context = getAudioContext();

  if (!context) {
    return;
  }

  SFX_LIBRARY[name].forEach((tone) => playTone(context, tone, settings.sfxVolume));
}

function getAudioContext(): AudioContext | null {
  if (contextUnavailable || typeof window === "undefined") {
    return null;
  }

  if (!audioContext) {
    const ContextConstructor =
      window.AudioContext ??
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!ContextConstructor) {
      contextUnavailable = true;
      return null;
    }

    audioContext = new ContextConstructor();
  }

  if (audioContext.state === "suspended") {
    void audioContext.resume();
  }

  return audioContext;
}

function playTone(context: AudioContext, tone: ToneSpec, volume: number): void {
  const startTime = context.currentTime + (tone.delayMs ?? 0) / 1000;
  const endTime = startTime + tone.durationMs / 1000;
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = tone.wave;
  oscillator.frequency.setValueAtTime(Math.max(30, tone.startFreq), startTime);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, tone.endFreq), endTime);

  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.001, tone.peak * volume), startTime + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, endTime);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startTime);
  oscillator.stop(endTime + 0.05);
}
