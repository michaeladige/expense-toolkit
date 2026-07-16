import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { DayTypePhrases, Language, TParams } from "./types";
import { DICTS } from "./index";
import { LOCALES, translate } from "./translate";

export interface I18n {
  lang: Language;
  /** Translate a dotted key, interpolating `{param}` placeholders. Falls back
   *  to English for any key the active language is missing. */
  t: (key: string, params?: TParams) => string;
  /** The active language's day-type phrase bank, for `lib/daytype.ts`. */
  daytype: DayTypePhrases;
  /** BCP-47 locale for Intl date/number formatting. */
  locale: string;
}

const I18nContext = createContext<I18n | null>(null);

export function I18nProvider({
  lang,
  children,
}: {
  lang: Language;
  children: ReactNode;
}) {
  const value = useMemo<I18n>(() => {
    const dict = DICTS[lang] ?? DICTS.en;
    return {
      lang,
      t: (key: string, params?: TParams) => translate(lang, key, params),
      daytype: dict.daytype,
      locale: LOCALES[lang] ?? "en",
    };
  }, [lang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useI18n(): I18n {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within an I18nProvider");
  return ctx;
}
