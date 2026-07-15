import { useRef, useState } from "react";
import type { Category, Expense, Income } from "../types";
import { csvToEntries, entriesToCSV } from "../lib/csv";
import { todayISO } from "../lib/dates";
import styles from "./DataControls.module.css";

interface Props {
  expenses: Expense[];
  incomes: Income[];
  categories: Category[];
  incomeCategories: Category[];
  categoryById: (id: string) => Category | undefined;
  incomeCategoryById: (id: string) => Category | undefined;
  onImportExpenses: (list: Omit<Expense, "id" | "createdAt">[]) => void;
  onImportIncomes: (list: Omit<Income, "id" | "createdAt">[]) => void;
  onClearAll: () => void;
}

export function DataControls({
  expenses,
  incomes,
  categories,
  incomeCategories,
  categoryById,
  incomeCategoryById,
  onImportExpenses,
  onImportIncomes,
  onClearAll,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
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
      </div>
      {message && <p className={styles.message}>{message}</p>}
      <p className="muted" style={{ fontSize: "0.78rem" }}>
        CSV columns: date (YYYY-MM-DD), type (expense/income), amount, currency,
        category, note. Files without a type column import as expenses.
      </p>
    </div>
  );
}
