export function loadStoredState<T>(key: string, fallback?: T): T | undefined {
  try {
    const value = window.localStorage.getItem(key);
    if (!value) {
      return fallback;
    }
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function saveStoredState<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Browsers can block storage in private or embedded contexts.
  }
}

export function removeStoredState(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage failures; persistence is a convenience feature.
  }
}
