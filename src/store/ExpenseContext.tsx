import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import type { Budget, Category, Expense, Settings } from "../types";
import {
  DEFAULT_CATEGORIES,
  DEFAULT_SETTINGS,
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
  budgets: Budget[];
  settings: Settings;

  addExpense: (data: Omit<Expense, "id" | "createdAt">) => void;
  updateExpense: (id: string, data: Partial<Omit<Expense, "id">>) => void;
  deleteExpense: (id: string) => void;

  addCategory: (data: Omit<Category, "id">) => void;
  updateCategory: (id: string, data: Partial<Omit<Category, "id">>) => void;
  deleteCategory: (id: string) => void;

  setBudget: (categoryId: string, amount: number) => void;
  removeBudget: (id: string) => void;

  updateSettings: (data: Partial<Settings>) => void;

  categoryById: (id: string) => Category | undefined;
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
  const [budgets, setBudgets] = useLocalStorage<Budget[]>(
    STORAGE_KEYS.budgets,
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
      // Reassign orphaned expenses to "other" so totals stay consistent.
      setExpenses((prev) =>
        prev.map((e) => (e.categoryId === id ? { ...e, categoryId: "other" } : e))
      );
      setBudgets((prev) => prev.filter((b) => b.categoryId !== id));
    },
    [setCategories, setExpenses, setBudgets]
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

  const updateSettings = useCallback(
    (data: Partial<Settings>) => setSettings((prev) => ({ ...prev, ...data })),
    [setSettings]
  );

  const categoryById = useCallback(
    (id: string) => categories.find((c) => c.id === id),
    [categories]
  );

  const value = useMemo<ExpenseStore>(
    () => ({
      expenses,
      categories,
      budgets,
      settings,
      addExpense,
      updateExpense,
      deleteExpense,
      addCategory,
      updateCategory,
      deleteCategory,
      setBudget,
      removeBudget,
      updateSettings,
      categoryById,
    }),
    [
      expenses,
      categories,
      budgets,
      settings,
      addExpense,
      updateExpense,
      deleteExpense,
      addCategory,
      updateCategory,
      deleteCategory,
      setBudget,
      removeBudget,
      updateSettings,
      categoryById,
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
