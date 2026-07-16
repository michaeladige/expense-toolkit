import type {
  Budget,
  Category,
  Expense,
  Income,
  RecurringRule,
  Report,
  Settings,
} from "../types";

const APP_ID = "expense-toolkit";
const VERSION = 1;

export interface BackupData {
  expenses: Expense[];
  categories: Category[];
  incomes: Income[];
  incomeCategories: Category[];
  budgets: Budget[];
  reports: Report[];
  recurring: RecurringRule[];
  settings: Settings;
}

export interface BackupFile {
  app: typeof APP_ID;
  version: typeof VERSION;
  exportedAt: string;
  data: BackupData;
}

/** Full-state snapshot for backup. Deliberately excludes the FX-rate cache —
 *  it's refetchable and keyed to a base currency, not user data. */
export function buildBackup(data: BackupData): BackupFile {
  return {
    app: APP_ID,
    version: VERSION,
    exportedAt: new Date().toISOString(),
    data,
  };
}

export interface ParsedBackup {
  data: BackupData | null;
  error?: string;
}

function isEntryLike(v: unknown): v is { amount: unknown; date: unknown; categoryId: unknown } {
  return (
    typeof v === "object" &&
    v !== null &&
    "amount" in v &&
    "date" in v &&
    "categoryId" in v
  );
}

function isCategoryLike(v: unknown): v is { id: unknown; name: unknown } {
  return typeof v === "object" && v !== null && "id" in v && "name" in v;
}

/**
 * Parse and validate a backup file. Never throws — malformed input surfaces as
 * an error string so the caller can show it without losing current state.
 */
export function parseBackup(text: string): ParsedBackup {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { data: null, error: "That file isn't valid JSON." };
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    (parsed as Record<string, unknown>).app !== APP_ID
  ) {
    return { data: null, error: "That doesn't look like an Expense Toolkit backup file." };
  }
  if ((parsed as Record<string, unknown>).version !== VERSION) {
    return { data: null, error: "This backup was made with an unsupported version." };
  }

  const data = (parsed as Record<string, unknown>).data;
  if (typeof data !== "object" || data === null) {
    return { data: null, error: "Backup file is missing its data." };
  }
  const d = data as Record<string, unknown>;

  const expenses = d.expenses;
  const categories = d.categories;
  const incomes = d.incomes;
  const incomeCategories = d.incomeCategories;
  const budgets = d.budgets;
  const reports = d.reports;
  // Backups written before recurring rules existed won't have this key —
  // treat it as empty rather than rejecting an otherwise-valid backup.
  const recurring = d.recurring ?? [];
  const settings = d.settings;

  if (
    !Array.isArray(expenses) ||
    !Array.isArray(categories) ||
    !Array.isArray(incomes) ||
    !Array.isArray(incomeCategories) ||
    !Array.isArray(budgets) ||
    !Array.isArray(reports) ||
    !Array.isArray(recurring) ||
    typeof settings !== "object" ||
    settings === null
  ) {
    return { data: null, error: "Backup file is malformed (missing or invalid sections)." };
  }

  if (!expenses.every(isEntryLike) || !incomes.every(isEntryLike)) {
    return { data: null, error: "Backup file has malformed transactions." };
  }
  if (!categories.every(isCategoryLike) || !incomeCategories.every(isCategoryLike)) {
    return { data: null, error: "Backup file has malformed categories." };
  }

  return {
    data: {
      expenses: expenses as Expense[],
      categories: categories as Category[],
      incomes: incomes as Income[],
      incomeCategories: incomeCategories as Category[],
      budgets: budgets as Budget[],
      reports: reports as Report[],
      recurring: recurring as RecurringRule[],
      settings: settings as Settings,
    },
  };
}
