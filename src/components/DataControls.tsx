import { useRef, useState } from "react";
import type {
  Budget,
  Category,
  Expense,
  Income,
  RecurringRule,
  Report,
  Settings,
} from "../types";
import { csvToEntries, entriesToCSV, type ImportError } from "../lib/csv";
import { buildBackup, parseBackup, type BackupData } from "../lib/backup";
import { todayISO } from "../lib/dates";
import { useI18n } from "../lib/i18n/I18nContext";
import type { TFn } from "../lib/i18n/translate";
import styles from "./DataControls.module.css";

/** Turn a structured import error into a translated message. */
function importErrorText(e: ImportError, t: TFn): string {
  switch (e.code) {
    case "empty":
      return t("csv.error.empty");
    case "missingColumns":
      return t("csv.error.missingColumns");
    case "invalidDate":
      return t("csv.error.invalidDate", { row: e.row, value: e.value });
    case "invalidAmount":
      return t("csv.error.invalidAmount", { row: e.row });
    case "missingCurrency":
      return t("csv.error.missingCurrency", { row: e.row });
    case "unknownType":
      return t("csv.error.unknownType", { row: e.row, value: e.value });
  }
}

interface Props {
  expenses: Expense[];
  incomes: Income[];
  categories: Category[];
  incomeCategories: Category[];
  budgets: Budget[];
  reports: Report[];
  recurring: RecurringRule[];
  settings: Settings;
  categoryById: (id: string) => Category | undefined;
  incomeCategoryById: (id: string) => Category | undefined;
  onImportExpenses: (list: Omit<Expense, "id" | "createdAt">[]) => void;
  onImportIncomes: (list: Omit<Income, "id" | "createdAt">[]) => void;
  onClearAll: () => void;
  onRestoreAll: (data: BackupData) => void;
}

export function DataControls({
  expenses,
  incomes,
  categories,
  incomeCategories,
  budgets,
  reports,
  recurring,
  settings,
  categoryById,
  incomeCategoryById,
  onImportExpenses,
  onImportIncomes,
  onClearAll,
  onRestoreAll,
}: Props) {
  const { t } = useI18n();
  const fileRef = useRef<HTMLInputElement>(null);
  const backupFileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  function handleExport() {
    const csv = entriesToCSV(expenses, incomes, categoryById, incomeCategoryById);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expense-toolkit-${todayISO()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const {
        expenses: parsedExpenses,
        incomes: parsedIncomes,
        errors,
      } = csvToEntries(String(reader.result), categories, incomeCategories);
      if (parsedExpenses.length > 0) onImportExpenses(parsedExpenses);
      if (parsedIncomes.length > 0) onImportIncomes(parsedIncomes);
      const parts = [
        t("data.imported", {
          expenses: parsedExpenses.length,
          incomes: parsedIncomes.length,
        }),
      ];
      if (errors.length) parts.push(t("data.skipped", { n: errors.length }));
      // Surface the first specific problem so a fully-rejected import isn't opaque.
      if (parsedExpenses.length === 0 && parsedIncomes.length === 0 && errors.length)
        parts.push(importErrorText(errors[0], t));
      setMessage(parts.join(" "));
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function handleBackupExport() {
    const backup = buildBackup({
      expenses,
      categories,
      incomes,
      incomeCategories,
      budgets,
      reports,
      recurring,
      settings,
    });
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expense-toolkit-backup-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleBackupFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const { data, error } = parseBackup(String(reader.result));
      if (!data) {
        setMessage(error ? t(`backup.error.${error}`) : t("backup.error.readFail"));
        return;
      }
      if (window.confirm(t("data.restoreConfirm"))) {
        onRestoreAll(data);
        setMessage(t("data.restored"));
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function handleClear() {
    if (window.confirm(t("data.clearConfirm"))) {
      onClearAll();
      setMessage(t("data.cleared"));
    }
  }

  const isEmpty = expenses.length === 0 && incomes.length === 0;

  return (
    <div className={styles.wrap}>
      <div className={styles.buttons}>
        <button className="btn" onClick={handleExport} disabled={isEmpty}>
          {t("data.exportCsv")}
        </button>
        <button className="btn" onClick={() => fileRef.current?.click()}>
          {t("data.importCsv")}
        </button>
        <button className="btn" onClick={handleBackupExport} disabled={isEmpty}>
          {t("data.exportBackup")}
        </button>
        <button className="btn" onClick={() => backupFileRef.current?.click()}>
          {t("data.restoreBackup")}
        </button>
        <button className="btn btn-danger" onClick={handleClear}>
          {t("data.clearAll")}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          hidden
          onChange={handleFile}
        />
        <input
          ref={backupFileRef}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={handleBackupFile}
        />
      </div>
      {message && <p className={styles.message}>{message}</p>}
      <p className="muted" style={{ fontSize: "0.78rem" }}>
        {t("data.help")}
      </p>
    </div>
  );
}
