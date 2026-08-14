import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en";
import id from "./id";

export const LANGUAGES = [
  { code: "en", label: "EN" },
  { code: "id", label: "ID" },
] as const;

export type Locale = (typeof LANGUAGES)[number]["code"];

const STORAGE_KEY = "uncover-lang";

function storedLocale(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "en";
  } catch {
    return "en";
  }
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    id: { translation: id },
  },
  lng: storedLocale(),
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export function setLocale(code: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
    /* ignore */
  }
  void i18n.changeLanguage(code);
}

export default i18n;
