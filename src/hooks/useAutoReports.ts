import { useCallback, useEffect, useState } from "react";
import type {
  Category,
  Expense,
  Income,
  RateMap,
  Report,
  ReportPeriod,
  Settings,
} from "../types";
import { getRange, todayISO } from "../lib/dates";
import { rangeHasMissingDay } from "../lib/catchup";
import { formatMoney } from "../lib/currency";
import { buildReport, pendingReportPeriods, previousNet } from "../lib/reports";
import { notify } from "../lib/notify";
import type { Language } from "../lib/i18n/types";
import { translate } from "../lib/i18n/translate";
import type { RateStatus } from "./useExchangeRates";

const PERIODS: ReportPeriod[] = ["week", "month"];

interface Args {
  expenses: Expense[];
  incomes: Income[];
  reports: Report[];
  settings: Settings;
  rates: RateMap;
  rateStatus: RateStatus;
  /**
   * Days the user hasn't logged yet and is being asked to catch up on (see
   * `findMissingDays`). A period containing one is held back: reports are
   * frozen snapshots, so generating it now would permanently freeze totals
   * that are about to be filled in.
   */
  missingDays: ReadonlySet<string>;
  categoryById: (id: string) => Category | undefined;
  incomeCategoryById: (id: string) => Category | undefined;
  addReports: (list: Report[]) => void;
  updateSettings: (data: Partial<Settings>) => void;
}

function summarize(
  generated: Report[],
  lang: Language
): { title: string; body: string } {
  if (generated.length === 1) {
    const r = generated[0];
    const sign = r.net >= 0 ? "+" : "";
    const approx = r.approximate ? "≈" : "";
    const period = translate(lang, r.period === "week" ? "period.weekly" : "period.monthly");
    return {
      title: translate(lang, "notify.singleTitle", { period }),
      body: translate(lang, "notify.singleBody", {
        label: r.label,
        net: `${approx}${sign}${formatMoney(r.net, r.baseCurrency)}`,
        income: formatMoney(r.incomeTotal, r.baseCurrency),
        expense: formatMoney(r.expenseTotal, r.baseCurrency),
      }),
    };
  }
  return {
    title: translate(lang, "notify.multiTitle", { n: generated.length }),
    body: generated.map((r) => r.label).join(" · "),
  };
}

/**
 * Generates a report for every week/month that ended since the last visit, and
 * announces it.
 *
 * The app has no backend and browsers can't run a web app's code on a schedule
 * while it's closed, so reports are produced on open/focus rather than at the
 * instant a period ends — a report for last week may appear days late, but no
 * period is ever skipped.
 */
export function useAutoReports({
  expenses,
  incomes,
  reports,
  settings,
  rates,
  rateStatus,
  missingDays,
  categoryById,
  incomeCategoryById,
  addReports,
  updateSettings,
}: Args) {
  const [fresh, setFresh] = useState<Report[]>([]);

  const check = useCallback(() => {
    // Rates are still resolving. Snapshotting now would freeze totals computed
    // against an empty rate map into a report that never recomputes.
    if (rateStatus === "idle" || rateStatus === "loading") return;

    // First ever run: start the clock today rather than reporting on however
    // much history already exists.
    if (!settings.reportsSince) {
      updateSettings({ reportsSince: todayISO() });
      return;
    }

    const now = new Date();
    const generated: Report[] = [];
    for (const period of PERIODS) {
      const refs = pendingReportPeriods(period, reports, settings.reportsSince, now);
      for (const ref of refs) {
        // Not skipped for good: it stays pending and generates on a later pass,
        // once the days are logged, marked no-spend, skipped, or aged out of
        // the catch-up lookback.
        if (rangeHasMissingDay(getRange(period, ref), missingDays)) continue;
        const report = buildReport({
          period,
          ref,
          expenses,
          incomes,
          categoryById,
          incomeCategoryById,
          baseCurrency: settings.baseCurrency,
          rates,
          prevNet: previousNet(period, ref, [...reports, ...generated]),
          lang: settings.language ?? "en",
        });
        // null when the period had no activity — nothing worth announcing.
        if (report) generated.push(report);
      }
    }
    if (generated.length === 0) return;

    addReports(generated);
    setFresh(generated);

    if (settings.notificationsEnabled) {
      const { title, body } = summarize(generated, settings.language ?? "en");
      // A single tag so repeat announcements replace rather than stack.
      void notify(title, { body, tag: "expense-toolkit-reports" });
    }
  }, [
    expenses,
    incomes,
    reports,
    settings,
    rates,
    rateStatus,
    missingDays,
    categoryById,
    incomeCategoryById,
    addReports,
    updateSettings,
  ]);

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
  }, [check]);

  return { fresh, dismissFresh: useCallback(() => setFresh([]), []) };
}
