import { loadSettings, type Language } from "../meta/settings";
import { en } from "./translations/en";
import { es } from "./translations/es";
import { zh } from "./translations/zh";

export type TranslationKey = keyof typeof en;

const DICTIONARIES: Record<Language, Record<TranslationKey, string>> = { en, zh, es };

export const LANGUAGE_NAMES: Record<Language, string> = {
  en: "English",
  zh: "中文",
  es: "Español"
};

export function t(key: TranslationKey, params?: Record<string, string | number>): string {
  const language = loadSettings().language;
  let text = DICTIONARIES[language][key] ?? en[key] ?? key;

  if (params) {
    Object.entries(params).forEach(([name, value]) => {
      text = text.replaceAll(`{${name}}`, String(value));
    });
  }

  return text;
}

export function isTranslationKey(value: string): value is TranslationKey {
  return value in en;
}
