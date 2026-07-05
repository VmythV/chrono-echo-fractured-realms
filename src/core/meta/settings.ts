export type GameSettings = {
  version: 1;
  sfxEnabled: boolean;
  sfxVolume: number;
};

const SETTINGS_KEY = "chrono-echo-settings-v1";
const VOLUME_STEPS = [0.7, 1, 0.4] as const;

let cachedSettings: GameSettings | null = null;

export function loadSettings(): GameSettings {
  if (cachedSettings) {
    return cachedSettings;
  }

  cachedSettings = readSettingsFromStorage();
  return cachedSettings;
}

export function saveSettings(settings: GameSettings): void {
  cachedSettings = settings;

  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function toggleSfxEnabled(): GameSettings {
  const settings = loadSettings();
  const nextSettings: GameSettings = { ...settings, sfxEnabled: !settings.sfxEnabled };
  saveSettings(nextSettings);
  return nextSettings;
}

export function cycleSfxVolume(): GameSettings {
  const settings = loadSettings();
  const currentIndex = VOLUME_STEPS.findIndex((step) => step === settings.sfxVolume);
  const nextVolume = VOLUME_STEPS[(currentIndex + 1) % VOLUME_STEPS.length];
  const nextSettings: GameSettings = { ...settings, sfxVolume: nextVolume };
  saveSettings(nextSettings);
  return nextSettings;
}

export function formatVolumeLabel(volume: number): string {
  if (volume <= 0.4) {
    return "Low";
  }

  return volume >= 1 ? "High" : "Normal";
}

function readSettingsFromStorage(): GameSettings {
  if (typeof window === "undefined") {
    return createDefaultSettings();
  }

  try {
    const rawSettings = window.localStorage.getItem(SETTINGS_KEY);

    if (!rawSettings) {
      return createDefaultSettings();
    }

    const parsed = JSON.parse(rawSettings) as Partial<GameSettings>;

    if (parsed.version !== 1) {
      return createDefaultSettings();
    }

    return {
      version: 1,
      sfxEnabled: typeof parsed.sfxEnabled === "boolean" ? parsed.sfxEnabled : true,
      sfxVolume: normalizeVolume(parsed.sfxVolume)
    };
  } catch {
    return createDefaultSettings();
  }
}

function normalizeVolume(value: unknown): number {
  if (typeof value !== "number") {
    return 0.7;
  }

  const closest = VOLUME_STEPS.reduce((best, step) =>
    Math.abs(step - value) < Math.abs(best - value) ? step : best
  );

  return closest;
}

function createDefaultSettings(): GameSettings {
  return {
    version: 1,
    sfxEnabled: true,
    sfxVolume: 0.7
  };
}
