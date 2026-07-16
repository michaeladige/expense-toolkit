/** The languages the UI can be shown in. English is the source of truth and
 *  the fallback for any key a translation is missing. */
export type Language = "en" | "id" | "jv";

/** Params passed to an interpolated string, e.g. `{ n: 3, kind: "expense" }`. */
export type TParams = Record<string, string | number>;

/** A single translation entry: either a literal string (which may contain
 *  `{param}` placeholders) or a function of the params for anything that needs
 *  real logic (counts, joining, conditional wording). */
export type TranslationValue = string | ((p: TParams) => string);

/**
 * One language's dictionary. `strings` is the flat, dotted-key map of UI copy.
 * `defaultCategoryNames` translates the seed category ids (see
 * `categoryName.ts`). `daytype` is the phrase bank the narrative generators in
 * `lib/daytype.ts` pick from, kept separate because those pick a variant by a
 * deterministic seed rather than being looked up by key.
 */
export interface TranslationDict {
  strings: Record<string, TranslationValue>;
  defaultCategoryNames: Record<string, string>;
  daytype: DayTypePhrases;
}

/** The funny day-type narrative variants, per language. Arrays are picked from
 *  deterministically by seed in `lib/daytype.ts`, so order is stable copy, not
 *  priority. Functions receive `{ ratio, top, other, name }` as needed. */
export interface DayTypePhrases {
  /** Noun for each day type, e.g. workdays / days off (already plural). */
  noun: { workday: string; dayoff: string };
  /** Used when 100% of spend is on one day type. Keyed by that type. */
  single: { workday: string[]; dayoff: string[] };
  /** ratio < 1.15 — the two day types cost about the same. */
  even: string[];
  /** ratio >= 2 — top day type dwarfs the other. `p`: { ratio, top, other }. */
  dominant: ((p: TParams) => string)[];
  /** In between — top edges out the other. `p`: { top, other }. */
  lean: ((p: TParams) => string)[];
  /** Advice when there's only one active day type. */
  adviceSingle: string;
  /** Advice when top runs >= 1.5x the other. `p`: { ratio, top }. */
  adviceDominant: (p: TParams) => string;
  /** Advice when day types are balanced. */
  adviceBalanced: string;
  /** Category quip on days off. `p`: { name }. */
  quipDayoff: ((p: TParams) => string)[];
  /** Category quip on workdays (fallback). `p`: { name }. */
  quipWorkday: (p: TParams) => string;
}
