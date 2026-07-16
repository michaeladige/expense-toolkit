import type { Category } from "../../types";
import type { Language } from "./types";
import { DICTS } from "./index";

/**
 * Display name for a category in the active language.
 *
 * Seed categories (the ids in `DICTS.en.defaultCategoryNames`) get their funny
 * translation, but ONLY while the stored name still equals the English default
 * — so a category the user renamed, or one they created, always shows exactly
 * what they typed. This translates the defaults live across a language switch
 * with no stored-data migration, while never overwriting a user's own words.
 */
export function displayCategoryName(
  cat: Category | undefined,
  lang: Language
): string {
  if (!cat) return DICTS[lang].strings["common.uncategorized"] as string;
  const englishDefault = DICTS.en.defaultCategoryNames[cat.id];
  if (englishDefault && cat.name === englishDefault) {
    return DICTS[lang].defaultCategoryNames[cat.id] ?? cat.name;
  }
  return cat.name;
}

/** Resolve a category id to a display name, given a lookup. Convenience for the
 *  many `nameOf(id)` call sites. */
export function categoryNameOf(
  id: string,
  lookup: (id: string) => Category | undefined,
  lang: Language
): string {
  return displayCategoryName(lookup(id), lang);
}
