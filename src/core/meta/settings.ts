export type Language = "en" | "zh" | "es";
export type Difficulty = "easy" | "normal" | "hard";

export type GameSettings = {
  version: 1;
  sfxEnabled: boolean;
  sfxVolume: number;
  difficulty: Difficulty;
  language: Language;
};

const SETTINGS_KEY = "chrono-echo-settings-v1";
const VOLUME_STEPS = [0.7, 1, 0.4] as const;
const LANGUAGE_ORDER: Language[] = ["en", "zh", "es"];
const DIFFICULTY_ORDER: Difficulty[] = ["normal", "hard", "easy"];

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

export function cycleLanguage(): GameSettings {
  const settings = loadSettings();
  const currentIndex = LANGUAGE_ORDER.indexOf(settings.language);
  const nextSettings: GameSettings = {
    ...settings,
    language: LANGUAGE_ORDER[(currentIndex + 1) % LANGUAGE_ORDER.length]
  };
  saveSettings(nextSettings);
  return nextSettings;
}

export function cycleDifficulty(): GameSettings {
  const settings = loadSettings();
  const currentIndex = DIFFICULTY_ORDER.indexOf(settings.difficulty);
  const nextSettings: GameSettings = {
    ...settings,
    difficulty: DIFFICULTY_ORDER[(currentIndex + 1) % DIFFICULTY_ORDER.length]
  };
  saveSettings(nextSettings);
  return nextSettings;
}

export function formatVolumeLabel(volume: number): "low" | "normal" | "high" {
  if (volume <= 0.4) {
    return "low";
  }

  return volume >= 1 ? "high" : "normal";
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
      sfxVolume: normalizeVolume(parsed.sfxVolume),
      difficulty: normalizeDifficulty(parsed.difficulty),
      language: normalizeLanguage(parsed.language)
    };
  } catch {
    return createDefaultSettings();
  }
}

function normalizeDifficulty(value: unknown): Difficulty {
  return DIFFICULTY_ORDER.includes(value as Difficulty) ? (value as Difficulty) : "normal";
}

function normalizeLanguage(value: unknown): Language {
  return LANGUAGE_ORDER.includes(value as Language) ? (value as Language) : "en";
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
    sfxVolume: 0.7,
    difficulty: "normal",
    language: "en"
  };
}
