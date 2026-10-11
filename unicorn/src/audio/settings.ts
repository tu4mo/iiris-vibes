const MUTED_KEY = 'unicorn-designer:music-muted'

// Whether the player turned the music off last time. False when storage is unavailable.
export function loadMuted(): boolean {
  try {
    return localStorage.getItem(MUTED_KEY) === 'true'
  } catch {
    return false
  }
}

export function saveMuted(muted: boolean) {
  try {
    localStorage.setItem(MUTED_KEY, String(muted))
  } catch {
    // Storage can be full or blocked (e.g. private mode); the setting lasts this visit.
  }
}
