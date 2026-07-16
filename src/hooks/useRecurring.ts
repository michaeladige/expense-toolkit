import { useCallback, useEffect } from "react";
import type { RecurringRule } from "../types";
import { dueDates, isWorkingDayAnchor, resolveSchedule } from "../lib/recurring";
import type { WorkCalendar } from "../lib/workdays";
import type { HolidayStatus } from "./useHolidays";

interface Args {
  recurring: RecurringRule[];
  applyRecurring: (rule: RecurringRule, dates: string[]) => void;
  calendar: WorkCalendar;
  holidayStatus: HolidayStatus;
}

/**
 * Materializes due recurring rules into real entries on app open/focus — the
 * same trigger `useAutoReports` uses, since browsers can't run a closed web
 * app's code on a schedule. Idempotent: `applyRecurring` advances a rule's
 * `lastApplied` watermark in the same pass it writes entries, so repeat calls
 * for an already-applied occurrence produce nothing.
 *
 * Rules whose date depends on holidays wait for the holiday fetch to settle
 * before firing, the same way `useAutoReports` won't snapshot against an empty
 * rate map: entries are frozen once written, and a cold start always beats the
 * network, so firing on mount would permanently date them as if no holiday
 * existed. Once it settles — live, cached, failed, or no country configured —
 * they go ahead with whatever is known, falling back to weekends only. Rules on
 * a fixed day never wait; they don't depend on the data.
 */
export function useRecurring({
  recurring,
  applyRecurring,
  calendar,
  holidayStatus,
}: Args) {
  const holidaysPending = holidayStatus === "idle" || holidayStatus === "loading";

  const check = useCallback(() => {
    const now = new Date();
    for (const rule of recurring) {
      if (holidaysPending && isWorkingDayAnchor(resolveSchedule(rule).anchor)) continue;
      const dates = dueDates(rule, now, calendar);
      if (dates.length > 0) applyRecurring(rule, dates);
    }
  }, [recurring, applyRecurring, calendar, holidaysPending]);

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
