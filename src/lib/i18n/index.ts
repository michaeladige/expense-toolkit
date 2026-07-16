import type { Language, TranslationDict } from "./types";
import { en } from "./en";
import { id } from "./id";
import { jv } from "./jv";

export const DICTS: Record<Language, TranslationDict> = { en, id, jv };

/** Language options for the picker, in display order. */
export const LANGUAGES: { code: Language; label: string }[] = [
  { code: "en", label: "English" },
  { code: "id", label: "Bahasa Indonesia" },
  { code: "jv", label: "Basa Jawa 🫡" },
];

export type { Language, TranslationDict } from "./types";
