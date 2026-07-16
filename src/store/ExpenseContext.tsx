import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import type {
  Budget,
  Category,
  Expense,
  Income,
  RecurringRule,
  Report,
  Settings,
} from "../types";
import type { BackupData } from "../lib/backup";
import {
  DEFAULT_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_SETTINGS,
  OTHER_EXPENSE_ID,
  OTHER_INCOME_ID,
  STORAGE_KEYS,
} from "../lib/constants";
import { useLocalStorage } from "./useLocalStorage";

function uid(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  );
}

interface ExpenseStore {
  expenses: Expense[];
  categories: Category[];
  incomes: Income[];
  incomeCategories: Category[];
  budgets: Budget[];
  reports: Report[];
  recurring: RecurringRule[];
  settings: Settings;

  addExpense: (data: Omit<Expense, "id" | "createdAt">) => void;
  updateExpense: (id: string, data: Partial<Omit<Expense, "id">>) => void;
  deleteExpense: (id: string) => void;
  importExpenses: (list: Omit<Expense, "id" | "createdAt">[]) => void;
  clearAllData: () => void;
  restoreAll: (data: BackupData) => void;

  addIncome: (data: Omit<Income, "id" | "createdAt">) => void;
  updateIncome: (id: string, data: Partial<Omit<Income, "id">>) => void;
  deleteIncome: (id: string) => void;
  importIncomes: (list: Omit<Income, "id" | "createdAt">[]) => void;

  addCategory: (data: Omit<Category, "id">) => void;
  updateCategory: (id: string, data: Partial<Omit<Category, "id">>) => void;
  deleteCategory: (id: string) => void;

  addIncomeCategory: (data: Omit<Category, "id">) => void;
  updateIncomeCategory: (id: string, data: Partial<Omit<Category, "id">>) => void;
  deleteIncomeCategory: (id: string) => void;

  setBudget: (categoryId: string, amount: number) => void;
  removeBudget: (id: string) => void;

  addReports: (list: Report[]) => void;

  addRecurring: (data: Omit<RecurringRule, "id">) => void;
  updateRecurring: (id: string, data: Partial<Omit<RecurringRule, "id">>) => void;
  deleteRecurring: (id: string) => void;
  /** Materializes the given due dates as entries for a rule and advances its
   *  `lastApplied` watermark in the same pass, so a partial failure can't
   *  double-apply an occurrence. */
  applyRecurring: (rule: RecurringRule, dates: string[]) => void;

  updateSettings: (data: Partial<Settings>) => void;

  categoryById: (id: string) => Category | undefined;
  incomeCategoryById: (id: string) => Category | undefined;
}

/** Move entries off a deleted category onto the side's catch-all, so totals stay consistent. */
function reassign<T extends { categoryId: string }>(
  entries: T[],
  from: string,
  to: string
): T[] {
  return entries.map((e) => (e.categoryId === from ? { ...e, categoryId: to } : e));
}

const ExpenseContext = createContext<ExpenseStore | null>(null);

export function ExpenseProvider({ children }: { children: ReactNode }) {
  const [expenses, setExpenses] = useLocalStorage<Expense[]>(
    STORAGE_KEYS.expenses,
    []
  );
  const [categories, setCategories] = useLocalStorage<Category[]>(
    STORAGE_KEYS.categories,
    DEFAULT_CATEGORIES
  );
  const [incomes, setIncomes] = useLocalStorage<Income[]>(
    STORAGE_KEYS.income,
    []
  );
  const [incomeCategories, setIncomeCategories] = useLocalStorage<Category[]>(
    STORAGE_KEYS.incomeCategories,
    DEFAULT_INCOME_CATEGORIES
  );
  const [budgets, setBudgets] = useLocalStorage<Budget[]>(
    STORAGE_KEYS.budgets,
    []
  );
  const [reports, setReports] = useLocalStorage<Report[]>(
    STORAGE_KEYS.reports,
    []
  );
  const [recurring, setRecurring] = useLocalStorage<RecurringRule[]>(
    STORAGE_KEYS.recurring,
    []
  );
  const [settings, setSettings] = useLocalStorage<Settings>(
    STORAGE_KEYS.settings,
    DEFAULT_SETTINGS
  );

  const addExpense = useCallback(
    (data: Omit<Expense, "id" | "createdAt">) => {
      setExpenses((prev) => [
        { ...data, id: uid(), createdAt: new Date().toISOString() },
        ...prev,
      ]);
    },
    [setExpenses]
  );

  const updateExpense = useCallback(
    (id: string, data: Partial<Omit<Expense, "id">>) => {
      setExpenses((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...data } : e))
      );
    },
    [setExpenses]
  );

  const deleteExpense = useCallback(
    (id: string) => setExpenses((prev) => prev.filter((e) => e.id !== id)),
    [setExpenses]
  );

  const importExpenses = useCallback(
    (list: Omit<Expense, "id" | "createdAt">[]) => {
      const now = new Date().toISOString();
      const created = list.map((d) => ({
        ...d,
        id: uid(),
        createdAt: now,
      }));
      setExpenses((prev) => [...created, ...prev]);
    },
    [setExpenses]
  );

  const addIncome = useCallback(
    (data: Omit<Income, "id" | "createdAt">) => {
      setIncomes((prev) => [
        { ...data, id: uid(), createdAt: new Date().toISOString() },
        ...prev,
      ]);
    },
    [setIncomes]
  );

  const updateIncome = useCallback(
    (id: string, data: Partial<Omit<Income, "id">>) => {
      setIncomes((prev) => prev.map((e) => (e.id === id ? { ...e, ...data } : e)));
    },
    [setIncomes]
  );

  const deleteIncome = useCallback(
    (id: string) => setIncomes((prev) => prev.filter((e) => e.id !== id)),
    [setIncomes]
  );

  const importIncomes = useCallback(
    (list: Omit<Income, "id" | "createdAt">[]) => {
      const now = new Date().toISOString();
      const created = list.map((d) => ({ ...d, id: uid(), createdAt: now }));
      setIncomes((prev) => [...created, ...prev]);
    },
    [setIncomes]
  );

  const clearAllData = useCallback(() => {
    setExpenses([]);
    setIncomes([]);
    setBudgets([]);
    setReports([]);
    setRecurring([]);
    setCategories(DEFAULT_CATEGORIES);
    setIncomeCategories(DEFAULT_INCOME_CATEGORIES);
    setSettings(DEFAULT_SETTINGS);
  }, [
    setExpenses,
    setIncomes,
    setBudgets,
    setReports,
    setRecurring,
    setCategories,
    setIncomeCategories,
    setSettings,
  ]);

  const restoreAll = useCallback(
    (data: BackupData) => {
      setExpenses(data.expenses);
      setCategories(data.categories);
      setIncomes(data.incomes);
      setIncomeCategories(data.incomeCategories);
      setBudgets(data.budgets);
      setReports(data.reports);
      setRecurring(data.recurring);
      setSettings(data.settings);
    },
    [
      setExpenses,
      setCategories,
      setIncomes,
      setIncomeCategories,
      setBudgets,
      setReports,
      setRecurring,
      setSettings,
    ]
  );

  const addCategory = useCallback(
    (data: Omit<Category, "id">) =>
      setCategories((prev) => [...prev, { ...data, id: uid() }]),
    [setCategories]
  );

  const updateCategory = useCallback(
    (id: string, data: Partial<Omit<Category, "id">>) =>
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...data } : c))
      ),
    [setCategories]
  );

  const deleteCategory = useCallback(
    (id: string) => {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setExpenses((prev) => reassign(prev, id, OTHER_EXPENSE_ID));
      setBudgets((prev) => prev.filter((b) => b.categoryId !== id));
      setRecurring((prev) => reassign(prev, id, OTHER_EXPENSE_ID));
    },
    [setCategories, setExpenses, setBudgets, setRecurring]
  );

  const addIncomeCategory = useCallback(
    (data: Omit<Category, "id">) =>
      setIncomeCategories((prev) => [...prev, { ...data, id: uid() }]),
    [setIncomeCategories]
  );

  const updateIncomeCategory = useCallback(
    (id: string, data: Partial<Omit<Category, "id">>) =>
      setIncomeCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...data } : c))
      ),
    [setIncomeCategories]
  );

  const deleteIncomeCategory = useCallback(
    (id: string) => {
      setIncomeCategories((prev) => prev.filter((c) => c.id !== id));
      setIncomes((prev) => reassign(prev, id, OTHER_INCOME_ID));
      setRecurring((prev) => reassign(prev, id, OTHER_INCOME_ID));
    },
    [setIncomeCategories, setIncomes, setRecurring]
  );

  const setBudget = useCallback(
    (categoryId: string, amount: number) => {
      setBudgets((prev) => {
        const existing = prev.find((b) => b.categoryId === categoryId);
        if (existing) {
          return prev.map((b) =>
            b.categoryId === categoryId ? { ...b, amount } : b
          );
        }
        return [...prev, { id: uid(), categoryId, amount }];
      });
    },
    [setBudgets]
  );

  const removeBudget = useCallback(
    (id: string) => setBudgets((prev) => prev.filter((b) => b.id !== id)),
    [setBudgets]
  );

  const addReports = useCallback(
    (list: Report[]) => {
      if (list.length === 0) return;
      // Dedupe inside the updater: report ids are derived from their period, so
      // two overlapping generation passes can't produce a duplicate.
      setReports((prev) => {
        const have = new Set(prev.map((r) => r.id));
        const fresh = list.filter((r) => !have.has(r.id));
        return fresh.length > 0 ? [...fresh, ...prev] : prev;
      });
    },
    [setReports]
  );

  const addRecurring = useCallback(
    (data: Omit<RecurringRule, "id">) =>
      setRecurring((prev) => [...prev, { ...data, id: uid() }]),
    [setRecurring]
  );

  const updateRecurring = useCallback(
    (id: string, data: Partial<Omit<RecurringRule, "id">>) =>
      setRecurring((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...data } : r))
      ),
    [setRecurring]
  );

  const deleteRecurring = useCallback(
    (id: string) => setRecurring((prev) => prev.filter((r) => r.id !== id)),
    [setRecurring]
  );

  const applyRecurring = useCallback(
    (rule: RecurringRule, dates: string[]) => {
      if (dates.length === 0) return;
      const now = new Date().toISOString();
      const created = dates.map((date) => ({
        id: uid(),
        createdAt: now,
        amount: rule.amount,
        currency: rule.currency,
        categoryId: rule.categoryId,
        date,
        note: rule.note,
        recurringId: rule.id,
      }));
      if (rule.kind === "income") {
        setIncomes((prev) => [...created, ...prev]);
      } else {
        setExpenses((prev) => [...created, ...prev]);
      }
      // `dates` is oldest-first (see dueDates), so the last entry is the most
      // recent occurrence — advance the watermark to it in the same pass so a
      // dropped update can't leave an occurrence appliable twice.
      const lastDate = dates[dates.length - 1];
      setRecurring((prev) =>
        prev.map((r) => (r.id === rule.id ? { ...r, lastApplied: lastDate } : r))
      );
    },
    [setExpenses, setIncomes, setRecurring]
  );

  const updateSettings = useCallback(
    (data: Partial<Settings>) => setSettings((prev) => ({ ...prev, ...data })),
    [setSettings]
  );

  const categoryById = useCallback(
    (id: string) => categories.find((c) => c.id === id),
    [categories]
  );

  const incomeCategoryById = useCallback(
    (id: string) => incomeCategories.find((c) => c.id === id),
    [incomeCategories]
  );

  const value = useMemo<ExpenseStore>(
    () => ({
      expenses,
      categories,
      incomes,
      incomeCategories,
      budgets,
      reports,
      recurring,
      settings,
      addExpense,
      updateExpense,
      deleteExpense,
      importExpenses,
      clearAllData,
      restoreAll,
      addIncome,
      updateIncome,
      deleteIncome,
      importIncomes,
      addCategory,
      updateCategory,
      deleteCategory,
      addIncomeCategory,
      updateIncomeCategory,
      deleteIncomeCategory,
      setBudget,
      removeBudget,
      addReports,
      addRecurring,
      updateRecurring,
      deleteRecurring,
      applyRecurring,
      updateSettings,
      categoryById,
      incomeCategoryById,
    }),
    [
      expenses,
      categories,
      incomes,
      incomeCategories,
      budgets,
      reports,
      recurring,
      settings,
      addExpense,
      updateExpense,
      deleteExpense,
      importExpenses,
      clearAllData,
      restoreAll,
      addIncome,
      updateIncome,
      deleteIncome,
      importIncomes,
      addCategory,
      updateCategory,
      deleteCategory,
      addIncomeCategory,
      updateIncomeCategory,
      deleteIncomeCategory,
      setBudget,
      removeBudget,
      addReports,
      addRecurring,
      updateRecurring,
      deleteRecurring,
      applyRecurring,
      updateSettings,
      categoryById,
      incomeCategoryById,
    ]
  );

  return (
    <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useExpenses(): ExpenseStore {
  const ctx = useContext(ExpenseContext);
  if (!ctx) throw new Error("useExpenses must be used within ExpenseProvider");
  return ctx;
}
