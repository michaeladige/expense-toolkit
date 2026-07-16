import { useCallback, useEffect } from "react";
import type { RecurringRule } from "../types";
import { dueDates } from "../lib/recurring";

interface Args {
  recurring: RecurringRule[];
  applyRecurring: (rule: RecurringRule, dates: string[]) => void;
}

/**
 * Materializes due recurring rules into real entries on app open/focus — the
 * same trigger `useAutoReports` uses, since browsers can't run a closed web
 * app's code on a schedule. Idempotent: `applyRecurring` advances a rule's
 * `lastApplied` watermark in the same pass it writes entries, so repeat calls
 * for an already-applied occurrence produce nothing.
 */
export function useRecurring({ recurring, applyRecurring }: Args) {
  const check = useCallback(() => {
    const now = new Date();
    for (const rule of recurring) {
      const dates = dueDates(rule, now);
      if (dates.length > 0) applyRecurring(rule, dates);
    }
  }, [recurring, applyRecurring]);

  useEffect(() => {
    check();
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", check);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", check);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [check]);
}
