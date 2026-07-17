import { useEffect, useRef, useState } from "react";
import { useI18n } from "../lib/i18n/I18nContext";
import styles from "./MobileMenu.module.css";

export interface MenuShortcut {
  id: string;
  label: string;
}

interface Props {
  /** Jump-to targets; selecting one scrolls to (and opens) that section. */
  shortcuts: MenuShortcut[];
  onJump: (id: string) => void;
  onReports: () => void;
  onSettings: () => void;
  reportCount: number;
}

/** Mobile-only hamburger: a dropdown of quick shortcuts to the app's sections. */
export function MobileMenu({ shortcuts, onJump, onReports, onSettings, reportCount }: Props) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = (fn: () => void) => () => {
    setOpen(false);
    fn();
  };

  return (
    <div className={styles.wrap} ref={ref}>
      <button
        type="button"
        className="btn btn-icon"
        aria-label={t("menu.open")}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        ☰
      </button>
      {open && (
        <div className={styles.menu} role="menu">
          <button className={styles.item} role="menuitem" onClick={choose(onReports)}>
            {t("app.reports")}
            {reportCount > 0 && ` (${reportCount})`}
          </button>
          <button className={styles.item} role="menuitem" onClick={choose(onSettings)}>
            {t("app.settings")}
          </button>
          <div className={styles.divider} />
          <span className={styles.heading}>{t("menu.jumpTo")}</span>
          {shortcuts.map((s) => (
            <button
              key={s.id}
              className={styles.item}
              role="menuitem"
              onClick={choose(() => onJump(s.id))}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
