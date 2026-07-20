import { useEffect } from "react";
import type { Settings } from "../types";
import {
  DEFAULT_COLOR,
  DEFAULT_FONT,
  DEFAULT_MODE,
  DEFAULT_PATTERN,
  resolveMode,
} from "../lib/theme";

/**
 * Normalise a computed colour for the `theme-color` meta.
 *
 * `--bg` is a `color-mix()`, which computes to CSS Color 4 `color(srgb r g b)`.
 * The meta tag doesn't accept that syntax and silently ignores it, so the value
 * has to come back as plain `rgb()`. Anything already in a legacy form is passed
 * through untouched.
 */
function toRgbString(color: string): string {
  const srgb = color.match(
    /^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)$/
  );
  if (!srgb) return color;
  const [r, g, b] = srgb
    .slice(1, 4)
    .map((v) => Math.round(Math.min(1, Math.max(0, parseFloat(v))) * 255));
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Mirrors the resolved theme into the `theme-color` meta, which tints the
 * browser chrome / status bar on mobile — the app's primary platform. Read off
 * the computed body background rather than the `--bg` custom property, because
 * a custom property computes to its token stream (`color-mix(...)`), not a
 * resolved colour.
 */
function syncThemeColorMeta() {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) return;
  const bg = getComputedStyle(document.body).backgroundColor;
  if (bg) meta.setAttribute("content", toRgbString(bg));
}

/**
 * Applies the appearance settings to `<html>` as data-* attributes, which
 * `index.css` turns into palette values.
 *
 * The same attributes are set before first paint by the inline script in
 * index.html; this hook takes over once React mounts and keeps them current.
 */
export function useTheme(settings: Settings) {
  const mode = settings.mode ?? DEFAULT_MODE;
  const themeColor = settings.themeColor ?? DEFAULT_COLOR;
  const pattern = settings.pattern ?? DEFAULT_PATTERN;
  const font = settings.font ?? DEFAULT_FONT;

  useEffect(() => {
    const root = document.documentElement;

    const apply = () => {
      root.dataset.mode = resolveMode(mode);
      root.dataset.theme = themeColor;
      root.dataset.pattern = pattern;
      root.dataset.font = font;
      syncThemeColorMeta();
    };

    apply();

    // Only "system" needs to track the OS; an explicit choice must not move.
    if (mode !== "system" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [mode, themeColor, pattern, font]);
}
