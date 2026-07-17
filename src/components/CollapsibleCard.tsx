import { useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { CollapseControlContext } from "./collapseControl";
import styles from "./CollapsibleCard.module.css";

interface Props {
  /** Heading shown on the collapsed bar (mobile only). */
  title: string;
  /** Collapsed on first render — only takes effect on mobile. */
  defaultCollapsed?: boolean;
  /** DOM id for jump-to navigation from the mobile menu. */
  anchorId?: string;
  children: ReactNode;
}

/**
 * Wraps a `.card` panel and, on narrow screens only, turns it into a
 * collapsible section: the wrapper draws the card chrome and a tappable header,
 * the inner card's own chrome and heading are flattened away (see the module
 * CSS), so there's a single card with one title. On desktop the wrapper is
 * `display: contents` — it vanishes and the inner card renders exactly as it
 * would unwrapped, so this is a mobile-only affordance with no desktop cost.
 *
 * It also listens to `CollapseControlContext` so the topbar's collapse/expand-all
 * button and the menu's jump-to shortcuts can drive it, while the header button
 * still toggles it individually.
 */
export function CollapsibleCard({
  title,
  defaultCollapsed = false,
  anchorId,
  children,
}: Props) {
  const cmd = useContext(CollapseControlContext);
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const seen = useRef(cmd.n);

  useEffect(() => {
    if (cmd.n === seen.current) return; // initial mount, or already applied
    seen.current = cmd.n;
    if (cmd.targetId && cmd.targetId !== anchorId) return; // aimed at another card
    setCollapsed(cmd.collapsed);
  }, [cmd, anchorId]);

  return (
    <div id={anchorId} className={`${styles.wrap} ${collapsed ? styles.collapsed : ""}`}>
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
