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
import { csvToEntries, entriesToCSV } from "../lib/csv";
import { buildBackup, parseBackup, type BackupData } from "../lib/backup";
import { todayISO } from "../lib/dates";
import styles from "./DataControls.module.css";

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
        `Imported ${parsedExpenses.length} expense(s), ${parsedIncomes.length} income(s).`,
      ];
      if (errors.length) parts.push(`${errors.length} row(s) skipped.`);
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
        setMessage(error ?? "Could not read that backup file.");
        return;
      }
      if (
        window.confirm(
          "Restoring this backup will replace all current transactions, categories, budgets, reports and settings. Continue?"
        )
      ) {
        onRestoreAll(data);
        setMessage("Backup restored.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function handleClear() {
    if (
      window.confirm(
        "Delete all transactions, budgets and reports, and reset categories? This can't be undone."
      )
    ) {
      onClearAll();
      setMessage("All data cleared.");
    }
  }

  const isEmpty = expenses.length === 0 && incomes.length === 0;

  return (
    <div className={styles.wrap}>
      <div className={styles.buttons}>
        <button className="btn" onClick={handleExport} disabled={isEmpty}>
          ⬇ Export CSV
        </button>
        <button className="btn" onClick={() => fileRef.current?.click()}>
          ⬆ Import CSV
        </button>
        <button className="btn" onClick={handleBackupExport} disabled={isEmpty}>
          ⬇ Export backup (JSON)
        </button>
        <button className="btn" onClick={() => backupFileRef.current?.click()}>
          ⬆ Restore backup
        </button>
        <button className="btn btn-danger" onClick={handleClear}>
          Clear all
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
        CSV columns: date (YYYY-MM-DD), type (expense/income), amount, currency,
        category, note. Files without a type column import as expenses. The JSON
        backup captures everything — including categories, budgets, reports and
        settings — and a restore replaces all current data.
      </p>
    </div>
  );
}
