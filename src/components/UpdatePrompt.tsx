import { useRegisterSW } from "virtual:pwa-register/react";
import { useI18n } from "../lib/i18n/I18nContext";
import styles from "./UpdatePrompt.module.css";

export function UpdatePrompt() {
  const { t } = useI18n();
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(error) {
      console.error("[pwa] service worker registration failed:", error);
    },
  });

  if (!needRefresh && !offlineReady) return null;

  function close() {
    setNeedRefresh(false);
    setOfflineReady(false);
  }

  return (
    <div className={`card ${styles.toast}`} role="status">
      <span className={styles.message}>
        {needRefresh ? t("update.available") : t("update.offlineReady")}
      </span>
      <div className={styles.actions}>
        {needRefresh && (
          <button
            className="btn btn-primary"
            onClick={() => updateServiceWorker(true)}
          >
            {t("update.reload")}
          </button>
        )}
        <button className="btn btn-ghost" onClick={close}>
          {t("toast.dismiss")}
        </button>
      </div>
    </div>
  );
}
