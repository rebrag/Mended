/**
 * Remembers, on this device only, which one-time animations have already played.
 * Storage may be unavailable (private mode); then everything counts as seen so nothing replays forever.
 */
const PREFIX = "mended:seen:";

export function readSeen(key: string): boolean {
  try {
    return localStorage.getItem(PREFIX + key) === "1";
  } catch {
    return true;
  }
}

export function markSeen(key: string) {
  try {
    localStorage.setItem(PREFIX + key, "1");
  } catch {
    // Storage unavailable; the animation simply plays again next time.
  }
}
