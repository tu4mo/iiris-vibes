import { useEffect, useState } from 'react'
import { music } from '../../audio/music'
import { loadMuted, saveMuted } from '../../audio/settings'
import type { Song } from '../../audio/song'

// Plays `song` on a loop, switching when it changes. Sound starts with the first key press
// or click, since browsers don't allow it before. Returns the mute setting and a toggle.
export function useMusic(song: Song) {
  const [muted, setMuted] = useState(loadMuted)

  useEffect(() => {
    const unlock = () => music.unlock()
    window.addEventListener('keydown', unlock)
    window.addEventListener('pointerdown', unlock)
    return () => {
      window.removeEventListener('keydown', unlock)
      window.removeEventListener('pointerdown', unlock)
    }
  }, [])

  useEffect(() => {
    music.play(song)
  }, [song])

  useEffect(() => {
    music.setMuted(muted)
    saveMuted(muted)
  }, [muted])

  return { muted, toggleMuted: () => setMuted((m) => !m) }
}
