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
import { todayISO } from "../lib/dates";
import { formatMoney } from "../lib/currency";
import { buildReport, pendingReportPeriods, previousNet } from "../lib/reports";
import { notify } from "../lib/notify";
import type { RateStatus } from "./useExchangeRates";

const PERIODS: ReportPeriod[] = ["week", "month"];

interface Args {
  expenses: Expense[];
  incomes: Income[];
  reports: Report[];
  settings: Settings;
  rates: RateMap;
  rateStatus: RateStatus;
  categoryById: (id: string) => Category | undefined;
  incomeCategoryById: (id: string) => Category | undefined;
  addReports: (list: Report[]) => void;
  updateSettings: (data: Partial<Settings>) => void;
}

function summarize(generated: Report[]): { title: string; body: string } {
  if (generated.length === 1) {
    const r = generated[0];
    const sign = r.net >= 0 ? "+" : "";
    const approx = r.approximate ? "≈" : "";
    return {
      title: `Your ${r.period === "week" ? "weekly" : "monthly"} report is ready`,
      body:
        `${r.label}: ${approx}${sign}${formatMoney(r.net, r.baseCurrency)} net · ` +
        `${formatMoney(r.incomeTotal, r.baseCurrency)} in, ` +
        `${formatMoney(r.expenseTotal, r.baseCurrency)} out`,
    };
  }
  return {
    title: `${generated.length} new reports are ready`,
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
        });
        // null when the period had no activity — nothing worth announcing.
        if (report) generated.push(report);
      }
    }
    if (generated.length === 0) return;

    addReports(generated);
    setFresh(generated);

    if (settings.notificationsEnabled) {
      const { title, body } = summarize(generated);
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
