import type { Category, Expense } from "../types";

const HEADERS = ["date", "amount", "currency", "category", "note"] as const;

function escapeCell(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Serialize expenses to CSV, writing human-readable category names. */
export function expensesToCSV(
  expenses: Expense[],
  categoryById: (id: string) => Category | undefined
): string {
  const rows = [HEADERS.join(",")];
  for (const e of expenses) {
    const cells = [
      e.date,
      String(e.amount),
      e.currency,
      categoryById(e.categoryId)?.name ?? e.categoryId,
      e.note ?? "",
    ];
    rows.push(cells.map(escapeCell).join(","));
  }
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
  errors: string[];
}

/**
 * Parse CSV text back into expense drafts. Category names are matched to
 * existing categories (case-insensitive); unknown ones fall back to "other".
 */
export function csvToExpenses(
  text: string,
  categories: Category[]
): ParsedImport {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const errors: string[] = [];
  const expenses: Omit<Expense, "id" | "createdAt">[] = [];
  if (lines.length === 0) return { expenses, errors: ["File is empty."] };

  const header = parseLine(lines[0]).map((h) => h.trim().toLowerCase());
  const idx = (name: string) => header.indexOf(name);
  const iDate = idx("date");
  const iAmount = idx("amount");
  const iCurrency = idx("currency");
  const iCategory = idx("category");
  const iNote = idx("note");
  if (iDate < 0 || iAmount < 0 || iCurrency < 0) {
    return {
      expenses,
      errors: ['Missing required columns: "date", "amount", "currency".'],
    };
  }

  const byName = new Map(categories.map((c) => [c.name.toLowerCase(), c.id]));

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
    const catName = (iCategory >= 0 ? cells[iCategory] ?? "" : "").trim();
    const categoryId = byName.get(catName.toLowerCase()) ?? "other";
    const note = iNote >= 0 ? (cells[iNote] ?? "").trim() : "";
    expenses.push({
      date,
      amount,
      currency,
      categoryId,
      note: note || undefined,
    });
  }

  return { expenses, errors };
}
