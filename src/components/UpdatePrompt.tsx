import { useRegisterSW } from "virtual:pwa-register/react";
import styles from "./UpdatePrompt.module.css";

export function UpdatePrompt() {
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
        {needRefresh
          ? "A new version of Expense Toolkit is available."
          : "Expense Toolkit is ready to work offline."}
      </span>
      <div className={styles.actions}>
        {needRefresh && (
          <button
            className="btn btn-primary"
            onClick={() => updateServiceWorker(true)}
          >
            Reload
          </button>
        )}
        <button className="btn btn-ghost" onClick={close}>
          Dismiss
        </button>
      </div>
    </div>
  );
}
