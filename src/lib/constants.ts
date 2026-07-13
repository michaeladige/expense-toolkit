import type { Category, Settings } from "../types";

export const STORAGE_KEYS = {
  expenses: "expense-toolkit:expenses",
  categories: "expense-toolkit:categories",
  budgets: "expense-toolkit:budgets",
  settings: "expense-toolkit:settings",
  rates: "expense-toolkit:rates",
} as const;

/**
 * Seed categories. Colors are a distinct, reasonably colorblind-aware
 * categorical set reused by the donut chart and list accents.
 */
export const DEFAULT_CATEGORIES: Category[] = [
  { id: "food", name: "Food & Dining", color: "#3b82f6", icon: "🍽️" },
  { id: "transport", name: "Transport", color: "#f59e0b", icon: "🚌" },
  { id: "housing", name: "Housing", color: "#10b981", icon: "🏠" },
  { id: "entertainment", name: "Entertainment", color: "#8b5cf6", icon: "🎬" },
  { id: "health", name: "Health", color: "#ef4444", icon: "💊" },
  { id: "shopping", name: "Shopping", color: "#ec4899", icon: "🛍️" },
  { id: "gaming", name: "Gaming", color: "#06b6d4", icon: "🎮" },
  { id: "other", name: "Other", color: "#64748b", icon: "📦" },
];

export const DEFAULT_SETTINGS: Settings = {
  baseCurrency: "USD",
};

/**
 * Fallback palette for user-created categories, cycled by index so new
 * categories still get a stable distinct color.
 */
export const CATEGORY_PALETTE = [
  "#3b82f6",
  "#f59e0b",
  "#10b981",
  "#8b5cf6",
  "#ef4444",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#6366f1",
  "#84cc16",
];

/**
 * Common currencies offered in selects. Users can still record expenses in
 * any code the exchange-rate API supports, but this keeps the UI focused.
 */
export const CURRENCIES: { code: string; name: string }[] = [
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
  { code: "JPY", name: "Japanese Yen" },
  { code: "CHF", name: "Swiss Franc" },
  { code: "CAD", name: "Canadian Dollar" },
  { code: "AUD", name: "Australian Dollar" },
  { code: "CNY", name: "Chinese Yuan" },
  { code: "INR", name: "Indian Rupee" },
  { code: "IDR", name: "Indonesian Rupiah" },
  { code: "TWD", name: "Taiwan Dollar" },
  { code: "BRL", name: "Brazilian Real" },
  { code: "MXN", name: "Mexican Peso" },
  { code: "SEK", name: "Swedish Krona" },
  { code: "NOK", name: "Norwegian Krone" },
  { code: "DKK", name: "Danish Krone" },
  { code: "PLN", name: "Polish Zloty" },
  { code: "ZAR", name: "South African Rand" },
  { code: "SGD", name: "Singapore Dollar" },
  { code: "HKD", name: "Hong Kong Dollar" },
  { code: "NZD", name: "New Zealand Dollar" },
  { code: "TRY", name: "Turkish Lira" },
];
