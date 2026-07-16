/**
 * The three independent appearance axes. Each is stored in `Settings` and
 * surfaces as a `data-*` attribute on `<html>`; `src/index.css` turns those
 * attributes into CSS variable values. Nothing here knows about components.
 */

export type ThemeMode = "light" | "dark" | "system";
export type ThemeColor =
  | "indigo"
  | "violet"
  | "emerald"
  | "cyan"
  | "amber"
  | "rose";
export type ThemePattern = "none" | "dots" | "grid" | "diagonal";

/** A concrete mode, once "system" has been resolved. CSS only ever sees these. */
export type ResolvedMode = "light" | "dark";

/**
 * Defaults, applied wherever a setting is absent. These are duplicated by the
 * pre-paint inline script in index.html — keep the two in step.
 */
export const DEFAULT_MODE: ThemeMode = "system";
export const DEFAULT_COLOR: ThemeColor = "indigo";
export const DEFAULT_PATTERN: ThemePattern = "none";

export const THEME_MODES: { id: ThemeMode; label: string }[] = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
  { id: "system", label: "System" },
];

/**
 * Each colour contributes only its accent; the neutral ramp derives from it by
 * tinting (see index.css), so a new colour is one entry here plus one CSS rule.
 * Both shades are listed so the picker's swatch can match the active mode
 * rather than showing a dark accent against a dark background.
 */
export const THEME_COLORS: {
  id: ThemeColor;
  label: string;
  light: string;
  dark: string;
}[] = [
  { id: "indigo", label: "Indigo", light: "#4f46e5", dark: "#818cf8" },
  { id: "violet", label: "Violet", light: "#7c3aed", dark: "#a78bfa" },
  { id: "emerald", label: "Emerald", light: "#059669", dark: "#34d399" },
  { id: "cyan", label: "Cyan", light: "#0891b2", dark: "#22d3ee" },
  { id: "amber", label: "Amber", light: "#d97706", dark: "#fbbf24" },
  { id: "rose", label: "Rose", light: "#e11d48", dark: "#fb7185" },
];

export const THEME_PATTERNS: { id: ThemePattern; label: string }[] = [
  { id: "none", label: "None" },
  { id: "dots", label: "Dots" },
  { id: "grid", label: "Grid" },
  { id: "diagonal", label: "Diagonal" },
];

/** Resolve "system" against the OS preference. Light when unknowable (SSR/old browsers). */
export function resolveMode(mode: ThemeMode): ResolvedMode {
  if (mode !== "system") return mode;
  if (typeof window === "undefined" || !window.matchMedia) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/** The swatch colour to show for `color` in the picker, given the active mode. */
export function swatchFor(color: ThemeColor, mode: ResolvedMode): string {
  const entry = THEME_COLORS.find((c) => c.id === color) ?? THEME_COLORS[0];
  return mode === "dark" ? entry.dark : entry.light;
}
