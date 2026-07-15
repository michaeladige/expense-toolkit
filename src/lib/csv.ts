import type { Category, Expense, Income } from "../types";
import { OTHER_EXPENSE_ID, OTHER_INCOME_ID } from "./constants";

const HEADERS = ["date", "type", "amount", "currency", "category", "note"] as const;

function escapeCell(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

type CategoryLookup = (id: string) => Category | undefined;

/**
 * Serialize expenses and income to CSV, writing human-readable category names.
 * Rows are tagged in a "type" column; see `csvToEntries` for how files written
 * before income existed are still read back.
 */
export function entriesToCSV(
  expenses: Expense[],
  incomes: Income[],
  categoryById: CategoryLookup,
  incomeCategoryById: CategoryLookup
): string {
  const rows = [HEADERS.join(",")];
  const write = (
    list: (Expense | Income)[],
    kind: string,
    lookup: CategoryLookup
  ) => {
    for (const e of list) {
      const cells = [
        e.date,
        kind,
        String(e.amount),
        e.currency,
        lookup(e.categoryId)?.name ?? e.categoryId,
        e.note ?? "",
      ];
      rows.push(cells.map(escapeCell).join(","));
    }
  };
  write(expenses, "expense", categoryById);
  write(incomes, "income", incomeCategoryById);
  return rows.join("\n");
}

/** Parse a single CSV line, honoring quoted cells and escaped quotes. */
function parseLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

export interface ParsedImport {
  expenses: Omit<Expense, "id" | "createdAt">[];
  incomes: Omit<Income, "id" | "createdAt">[];
  errors: string[];
}

/**
 * Parse CSV text back into expense and income drafts. Category names are
 * matched to that side's existing categories (case-insensitive); unknown ones
 * fall back to the side's "Other".
 *
 * A file with no "type" column is read as all-expenses: that's the format this
 * app exported before income existed, and those backups must still restore.
 */
export function csvToEntries(
  text: string,
  categories: Category[],
  incomeCategories: Category[]
): ParsedImport {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const errors: string[] = [];
  const expenses: Omit<Expense, "id" | "createdAt">[] = [];
  const incomes: Omit<Income, "id" | "createdAt">[] = [];
  if (lines.length === 0) return { expenses, incomes, errors: ["File is empty."] };

  const header = parseLine(lines[0]).map((h) => h.trim().toLowerCase());
  const idx = (name: string) => header.indexOf(name);
  const iDate = idx("date");
  const iType = idx("type");
  const iAmount = idx("amount");
  const iCurrency = idx("currency");
  const iCategory = idx("category");
  const iNote = idx("note");
  if (iDate < 0 || iAmount < 0 || iCurrency < 0) {
    return {
      expenses,
      incomes,
      errors: ['Missing required columns: "date", "amount", "currency".'],
    };
  }

  const byName = new Map(categories.map((c) => [c.name.toLowerCase(), c.id]));
  const incomeByName = new Map(
    incomeCategories.map((c) => [c.name.toLowerCase(), c.id])
  );

  for (let i = 1; i < lines.length; i++) {
    const cells = parseLine(lines[i]);
    const date = (cells[iDate] ?? "").trim();
    const amount = parseFloat((cells[iAmount] ?? "").trim());
    const currency = (cells[iCurrency] ?? "").trim().toUpperCase();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      errors.push(`Row ${i + 1}: invalid date "${date}".`);
      continue;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      errors.push(`Row ${i + 1}: invalid amount.`);
      continue;
    }
    if (!currency) {
      errors.push(`Row ${i + 1}: missing currency.`);
      continue;
    }

    const rawType = (iType >= 0 ? cells[iType] ?? "" : "").trim().toLowerCase();
    if (iType >= 0 && rawType && rawType !== "expense" && rawType !== "income") {
      errors.push(`Row ${i + 1}: unknown type "${rawType}".`);
      continue;
    }
    const isIncome = rawType === "income";

    const catName = (iCategory >= 0 ? cells[iCategory] ?? "" : "").trim();
    const note = iNote >= 0 ? (cells[iNote] ?? "").trim() : "";
    const draft = {
      date,
      amount,
      currency,
      categoryId: isIncome
        ? incomeByName.get(catName.toLowerCase()) ?? OTHER_INCOME_ID
        : byName.get(catName.toLowerCase()) ?? OTHER_EXPENSE_ID,
      note: note || undefined,
    };
    if (isIncome) incomes.push(draft);
    else expenses.push(draft);
  }

  return { expenses, incomes, errors };
}
