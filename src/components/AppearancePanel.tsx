import type { Settings } from "../types";
import {
  DEFAULT_COLOR,
  DEFAULT_MODE,
  DEFAULT_PATTERN,
  THEME_COLORS,
  THEME_MODES,
  THEME_PATTERNS,
  resolveMode,
  swatchFor,
} from "../lib/theme";
import styles from "./AppearancePanel.module.css";

interface Props {
  settings: Settings;
  onUpdateSettings: (data: Partial<Settings>) => void;
}

export function AppearancePanel({ settings, onUpdateSettings }: Props) {
  const mode = settings.mode ?? DEFAULT_MODE;
  const themeColor = settings.themeColor ?? DEFAULT_COLOR;
  const pattern = settings.pattern ?? DEFAULT_PATTERN;
  // Swatches show the shade that's actually live, so a dark accent never sits
  // on a dark background looking muddy.
  const resolved = resolveMode(mode);

  return (
    <div className={styles.wrap}>
      <div className={styles.axis}>
        <span className={styles.axisLabel} id="theme-mode-label">
          Mode
        </span>
        <div
          className={styles.segmented}
          role="group"
          aria-labelledby="theme-mode-label"
        >
          {THEME_MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`${styles.segment} ${mode === m.id ? styles.segmentActive : ""}`}
              aria-pressed={mode === m.id}
              onClick={() => onUpdateSettings({ mode: m.id })}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.axis}>
        <span className={styles.axisLabel} id="theme-color-label">
          Color
        </span>
        <div
          className={styles.swatches}
          role="group"
          aria-labelledby="theme-color-label"
        >
          {THEME_COLORS.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`${styles.swatch} ${themeColor === c.id ? styles.swatchActive : ""}`}
              style={{ "--swatch": swatchFor(c.id, resolved) } as React.CSSProperties}
              aria-pressed={themeColor === c.id}
              aria-label={c.label}
              title={c.label}
              onClick={() => onUpdateSettings({ themeColor: c.id })}
            />
          ))}
        </div>
      </div>

      <div className={styles.axis}>
        <span className={styles.axisLabel} id="theme-pattern-label">
          Pattern
        </span>
        <div
          className={styles.patterns}
          role="group"
          aria-labelledby="theme-pattern-label"
        >
          {THEME_PATTERNS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`${styles.pattern} ${pattern === p.id ? styles.patternActive : ""}`}
              aria-pressed={pattern === p.id}
              onClick={() => onUpdateSettings({ pattern: p.id })}
            >
              {/* Inert preview tile: the same gradients index.css uses, scoped
                  to this swatch via data-preview. */}
              <span className={styles.patternSwatch} data-preview={p.id} aria-hidden />
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
