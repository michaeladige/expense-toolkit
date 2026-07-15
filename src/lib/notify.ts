/**
 * Thin wrapper over the Notification API.
 *
 * Two platform quirks drive the shape of this module:
 *  - On Android Chrome `new Notification()` throws; notifications must go
 *    through the service worker registration instead.
 *  - On iOS the API only exists once the PWA is installed to the home screen,
 *    so `supported()` is false in a normal Safari tab and callers must degrade
 *    rather than assume a notification was seen.
 */

export type NotifyPermission = "default" | "granted" | "denied" | "unsupported";

export function supported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function permission(): NotifyPermission {
  return supported() ? Notification.permission : "unsupported";
}

/** Must be called from a user gesture — iOS Safari rejects it otherwise. */
export async function requestPermission(): Promise<NotifyPermission> {
  if (!supported()) return "unsupported";
  try {
    return await Notification.requestPermission();
  } catch {
    return "denied";
  }
}

/** How long to wait for a service worker before giving up on it. */
const SW_READY_TIMEOUT_MS = 2000;

/**
 * The active service worker registration, or null if there isn't one.
 *
 * `navigator.serviceWorker.ready` never settles when nothing is registered — it
 * stays pending rather than rejecting — so awaiting it bare would hang forever
 * on the dev server (`devOptions.enabled: false`, no SW) or wherever
 * registration failed. Racing a timeout keeps that a fallback, not a deadlock.
 */
async function activeRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  try {
    return await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), SW_READY_TIMEOUT_MS)
      ),
    ]);
  } catch {
    return null;
  }
}

/**
 * Show a notification. Returns false when it could not be shown, so the caller
 * can fall back to in-app UI instead of silently dropping the message.
 */
export async function notify(
  title: string,
  options: NotificationOptions
): Promise<boolean> {
  if (!supported() || Notification.permission !== "granted") return false;

  // Preferred path: required on Android, works on desktop too.
  const reg = await activeRegistration();
  if (reg) {
    try {
      await reg.showNotification(title, options);
      return true;
    } catch {
      // Fall through: some browsers reject showNotification off a SW they own.
    }
  }

  try {
    // No service worker — desktop only; this constructor throws on Android.
    new Notification(title, options);
    return true;
  } catch {
    return false;
  }
}
