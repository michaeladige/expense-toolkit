import { useRef, useState } from "react";
import type { Category, Expense } from "../types";
import { csvToExpenses, expensesToCSV } from "../lib/csv";
import { todayISO } from "../lib/dates";
import styles from "./DataControls.module.css";

interface Props {
  expenses: Expense[];
  categories: Category[];
  categoryById: (id: string) => Category | undefined;
  onImport: (list: Omit<Expense, "id" | "createdAt">[]) => void;
  onClearAll: () => void;
}

export function DataControls({
  expenses,
  categories,
  categoryById,
  onImport,
  onClearAll,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  function handleExport() {
    const csv = expensesToCSV(expenses, categoryById);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenses-${todayISO()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const { expenses: parsed, errors } = csvToExpenses(
        String(reader.result),
        categories
      );
      if (parsed.length > 0) onImport(parsed);
      const parts = [`Imported ${parsed.length} expense(s).`];
      if (errors.length) parts.push(`${errors.length} row(s) skipped.`);
      setMessage(parts.join(" "));
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function handleClear() {
    if (
      window.confirm(
        "Delete all expenses and budgets and reset categories? This can't be undone."
      )
    ) {
      onClearAll();
      setMessage("All data cleared.");
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.buttons}>
        <button
          className="btn"
          onClick={handleExport}
          disabled={expenses.length === 0}
        >
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
        CSV columns: date (YYYY-MM-DD), amount, currency, category, note.
      </p>
    </div>
  );
}
