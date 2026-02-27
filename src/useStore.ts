import { useEffect, useCallback, useRef, useSyncExternalStore } from "react";

type Listener = () => void;

const listeners = new Map<string, Set<Listener>>();
const cache = new Map<string, unknown>();

function getListeners(key: string): Set<Listener> {
  let set = listeners.get(key);
  if (!set) {
    set = new Set();
    listeners.set(key, set);
  }
  return set;
}

function notify(key: string) {
  for (const fn of getListeners(key)) fn();
}

const canUseDOM =
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

function readStorage<T>(key: string, fallback: T): T {
  if (cache.has(key)) return cache.get(key) as T;
  if (canUseDOM) {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        const parsed = JSON.parse(raw) as T;
        cache.set(key, parsed);
        return parsed;
      }
    } catch {
      // localStorage unavailable or corrupt — fall through
    }
  }
  cache.set(key, fallback);
  return fallback;
}

function writeStorage<T>(key: string, value: T) {
  cache.set(key, value);
  if (canUseDOM) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // quota exceeded or unavailable — value still lives in cache
    }
  }
  notify(key);
}

/**
 * Remove a key from both the in-memory cache and `localStorage`.
 * All subscribed components will re-render with the `defaultValue`.
 */
export function removeStoreKey(key: string) {
  cache.delete(key);
  if (canUseDOM) {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
  notify(key);
}

/**
 * A React hook that persists state to `localStorage` and stays in sync across
 * every component that shares the same `key`.
 *
 * ```tsx
 * const [name, setName] = useStore("user-name", "Anonymous");
 * ```
 */
export function useStore<T>(
  key: string,
  defaultValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  // Stabilize defaultValue so inline objects/arrays don't cause
  // getSnapshot to be recreated every render.
  const defaultRef = useRef(defaultValue);
  defaultRef.current = defaultValue;

  const subscribe = useCallback(
    (onStoreChange: Listener) => {
      const set = getListeners(key);
      set.add(onStoreChange);
      return () => {
        set.delete(onStoreChange);
      };
    },
    [key],
  );

  const getSnapshot = useCallback(
    () => readStorage(key, defaultRef.current),
    [key],
  );

  const getServerSnapshot = useCallback(() => defaultRef.current, []);

  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      const current = readStorage(key, defaultRef.current);
      const resolved =
        typeof next === "function" ? (next as (prev: T) => T)(current) : next;
      writeStorage(key, resolved);
    },
    [key],
  );

  useEffect(() => {
    if (!canUseDOM) return;
    const handler = (e: StorageEvent) => {
      if (e.key === key) {
        cache.delete(key);
        notify(key);
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [key]);

  return [value, setValue];
}
