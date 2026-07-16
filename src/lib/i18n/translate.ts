import type { Language, TParams } from "./types";
import { DICTS } from "./index";

/** BCP-47 locale per language, for Intl date/number formatting. Javanese
 *  support is spotty in engines, but `toLocaleDateString` falls back to the
 *  default locale rather than throwing, so an unknown tag is harmless. */
export const LOCALES: Record<Language, string> = {
  en: "en",
  id: "id-ID",
  jv: "jv",
};

function interpolate(template: string, params?: TParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    k in params ? String(params[k]) : `{${k}}`
  );
}

/**
 * Look up a dotted key in `lang`'s dictionary, falling back to English for any
 * key the language is missing, then interpolating `{param}` placeholders. A key
 * that exists nowhere returns itself, so a typo is visible rather than blank.
 * Pure — no React — so hooks and lib code can translate too.
 */
export function translate(
  lang: Language,
  key: string,
  params?: TParams
): string {
  const dict = DICTS[lang] ?? DICTS.en;
  const entry = dict.strings[key] ?? DICTS.en.strings[key];
  if (entry == null) return key;
  if (typeof entry === "function") return entry(params ?? {});
  return interpolate(entry, params);
}

export type TFn = (key: string, params?: TParams) => string;

/** A translator bound to one language — handy where passing `lang` to every
 *  call would be noise (lib functions, notification builders). */
export function translator(lang: Language): TFn {
  return (key, params) => translate(lang, key, params);
}
