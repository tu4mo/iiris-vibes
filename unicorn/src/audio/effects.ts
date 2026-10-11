import { frequency, type Wave } from './song'

// Sound effects, made from the same waves as the music. Each is a handful of tones: a
// tone starts `at` seconds into the effect, lasts `length` seconds, and slides in pitch
// from `from` to `to` (note names, or Hz for noise's filter) as it fades out.

export type Effect = 'jump' | 'stomp' | 'level' | 'dress' | 'diamond'

export type Tone = {
  wave: Wave | 'noise'
  at: number
  length: number
  from: number
  to?: number
  volume: number
}

// A tone at a note, optionally sliding to another note.
function tone(
  wave: Wave,
  at: number,
  length: number,
  from: string,
  volume: number,
  to?: string,
): Tone {
  return {
    wave,
    at,
    length,
    from: frequency(from),
    to: to === undefined ? undefined : frequency(to),
    volume,
  }
}

// Notes played one after another, `each` seconds apart; the last one rings longer.
function run(wave: Wave, notes: string[], each: number, volume: number, last = each * 3) {
  return notes.map((note, i) =>
    tone(wave, i * each, i === notes.length - 1 ? last : each, note, volume),
  )
}

export const EFFECTS: Record<Effect, Tone[]> = {
  // A quick upward swoop.
  jump: [tone('pulse25', 0, 0.16, 'C5', 0.4, 'C6')],
  // A soft thud on the shell, then a springy bounce back up.
  stomp: [
    { wave: 'noise', at: 0, length: 0.07, from: 900, volume: 0.6 },
    tone('triangle', 0, 0.08, 'G3', 0.9, 'C3'),
    tone('pulse50', 0.05, 0.14, 'C4', 0.3, 'C6'),
  ],
  // A little fanfare going through a door: up a major chord and an octave.
  level: run('pulse25', ['C5', 'E5', 'G5', 'C6', 'E6', 'G6'], 0.07, 0.35, 0.35),
  // A magical sparkle running up two octaves, with a fainter echo.
  dress: [
    ...run('pulse12', ['G5', 'B5', 'D6', 'G6', 'B6', 'D7'], 0.045, 0.35, 0.2),
    ...run('pulse12', ['G5', 'B5', 'D6', 'G6', 'B6', 'D7'], 0.045, 0.12, 0.2).map((t) => ({
      ...t,
      at: t.at + 0.12,
    })),
  ],
  // The classic ching: a short note and a higher one that rings.
  diamond: [tone('pulse25', 0, 0.06, 'B5', 0.35), tone('pulse25', 0.06, 0.3, 'E6', 0.35)],
}
