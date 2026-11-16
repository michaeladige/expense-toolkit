import { fromISODate } from "../lib/dates";
import { useI18n } from "../lib/i18n/I18nContext";
import styles from "./CatchUpBanner.module.css";

interface Props {
  /** Missing days, oldest first. Never empty — the banner isn't rendered then. */
  missing: string[];
  /** Whether a completed report period is being held back by these days. */
  holdingReports: boolean;
  onCatchUp: () => void;
  onSkip: () => void;
}

export function CatchUpBanner({ missing, holdingReports, onCatchUp, onSkip }: Props) {
  const { t, locale } = useI18n();
  const since = fromISODate(missing[0]).toLocaleDateString(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  return (
    <div className={`card ${styles.banner}`} role="status">
      <span className={styles.icon} aria-hidden>
        🗓️
      </span>
      <div className={styles.text}>
        <strong>{t("catchUp.bannerTitle", { n: missing.length })}</strong>
        <span>
          {t("catchUp.bannerBody", { since })}
          {holdingReports && ` ${t("catchUp.bannerHeld")}`}
        </span>
      </div>
      <div className={styles.actions}>
        <button className="btn btn-primary" onClick={onCatchUp}>
          {t("catchUp.start")}
        </button>
        <button className="btn btn-ghost" onClick={onSkip}>
          {t("catchUp.skip")}
        </button>
      </div>
    </div>
  );
}
