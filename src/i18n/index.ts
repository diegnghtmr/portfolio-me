import { en, type MessageKey } from "./en";
import { es } from "./es";

const messages = { en, es };
export type Locale = keyof typeof messages;

export const siteName = "Diego Alejandro Flores Quintero";
export const siteHandle = "diegnghtmr";
export const languages = {
  en: { short: "EN", label: "View in English" },
  es: { short: "ES", label: "Ver en español" },
} satisfies Record<Locale, { short: string; label: string }>;

export const sections = ["work", "oss", "about", "contact"] as const satisfies readonly MessageKey[];

export const t = (locale: Locale, key: MessageKey) => messages[locale][key];
export const otherLocale = (locale: Locale): Locale => (locale === "en" ? "es" : "en");
export const localePath = (locale: Locale): `/${Locale}/` => `/${locale}/`;
