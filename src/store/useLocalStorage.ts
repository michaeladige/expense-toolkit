import { useCallback, useEffect, useState } from "react";

/**
 * State hook backed by localStorage. Reads the initial value once, writes on
 * change, and keeps multiple tabs in sync via the `storage` event.
 */
export function useLocalStorage<T>(
  key: string,
  initial: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw != null ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage full or unavailable (e.g. private mode) — keep in-memory state.
    }
  }, [key, value]);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === key && e.newValue != null) {
        try {
          setValue(JSON.parse(e.newValue) as T);
        } catch {
          /* ignore malformed cross-tab writes */
        }
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [key]);

  const set = useCallback(
    (next: T | ((prev: T) => T)) => setValue(next),
    []
  );

  return [value, set];
}
