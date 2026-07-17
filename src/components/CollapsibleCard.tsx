import { useState, type ReactNode } from "react";
import styles from "./CollapsibleCard.module.css";

interface Props {
  /** Heading shown on the collapsed bar (mobile only). */
  title: string;
  /** Collapsed on first render — only takes effect on mobile. */
  defaultCollapsed?: boolean;
  children: ReactNode;
}

/**
 * Wraps a `.card` panel and, on narrow screens only, turns it into a
 * collapsible section: the wrapper draws the card chrome and a tappable header,
 * the inner card's own chrome and heading are flattened away (see the module
 * CSS), so there's a single card with one title. On desktop the wrapper is
 * `display: contents` — it vanishes and the inner card renders exactly as it
 * would unwrapped, so this is a mobile-only affordance with no desktop cost.
 */
export function CollapsibleCard({ title, defaultCollapsed = false, children }: Props) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  return (
    <div className={`${styles.wrap} ${collapsed ? styles.collapsed : ""}`}>
      <button
        type="button"
        className={styles.header}
        aria-expanded={!collapsed}
        onClick={() => setCollapsed((c) => !c)}
      >
        <span className={styles.title}>{title}</span>
        <span className={styles.chevron} aria-hidden>
          ▾
        </span>
      </button>
      <div className={styles.body}>{children}</div>
    </div>
  );
}
