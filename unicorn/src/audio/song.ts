// Chiptune songs, written as text and played by the synth in music.ts.
//
// Time is counted in steps of a sixteenth note. A voice's notes are tokens separated by
// spaces: a note name with its octave (C4, F#5, Bb3) or a rest (-), optionally followed by
// its length in steps (E5:4). Without a length a token lasts the voice's `unit`. Bars can
// be marked with | for readability; they're ignored. A drum track works the same way,
// with k (kick), s (snare), h (hi-hat) and d (water drip) instead of notes.

export type Wave = 'pulse12' | 'pulse25' | 'pulse50' | 'triangle'

export type Voice = {
  wave: Wave
  volume: number
  // Notes fade from full volume to `sustain` (0 to 1) of it, over about `decay` seconds.
  decay: number
  sustain: number
  // A quieter repeat of each note, `delay` steps later.
  echo?: { delay: number; volume: number }
  // A pitch wobble, `depth` cents either way, `rate` times a second.
  vibrato?: { depth: number; rate: number }
  // Steps a token lasts when it doesn't say.
  unit?: number
  notes: string
}

export type Drum = 'k' | 's' | 'h' | 'd'

export type Song = {
  bpm: number
  voices: Voice[]
  drums?: { volume: number; unit?: number; hits: string }
}

// Something to play at a step: a note of one of the song's voices, or a drum hit.
export type SongEvent =
  | { kind: 'note'; voice: Voice; frequency: number; steps: number }
  | { kind: 'drum'; drum: Drum; volume: number }

// A song ready to play: what starts at each step, looping after `steps`.
export type CompiledSong = { stepSeconds: number; steps: number; events: SongEvent[][] }

const SEMITONES: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }

function frequency(note: string): number {
  const match = /^([A-G])(#|b)?(-?\d)$/.exec(note)
  if (!match) throw new Error(`Not a note: ${note}`)
  const [, letter, accidental, octave] = match
  const semitone = SEMITONES[letter] + (accidental === '#' ? 1 : accidental === 'b' ? -1 : 0)
  const midi = 12 * (Number(octave) + 1) + semitone
  return 440 * 2 ** ((midi - 69) / 12)
}

// The tokens of a track as [symbol, start step, length in steps], and its total length.
function parse(text: string, unit: number) {
  const tokens: [string, number, number][] = []
  let step = 0
  for (const token of text.split(/\s+/)) {
    if (token === '' || token === '|') continue
    const [symbol, length] = token.split(':')
    const steps = length ? Number(length) : unit
    if (symbol !== '-') tokens.push([symbol, step, steps])
    step += steps
  }
  return { tokens, steps: step }
}

export function compileSong(song: Song): CompiledSong {
  const voices = song.voices.map((voice) => ({ voice, ...parse(voice.notes, voice.unit ?? 1) }))
  const drums = song.drums && parse(song.drums.hits, song.drums.unit ?? 1)
  // Tracks should all be the same length; a shorter one rests until the song loops.
  const steps = Math.max(...voices.map((v) => v.steps), drums?.steps ?? 0)
  const events: SongEvent[][] = Array.from({ length: steps }, () => [])
  for (const { voice, tokens } of voices) {
    for (const [note, start, length] of tokens) {
      events[start].push({ kind: 'note', voice, frequency: frequency(note), steps: length })
    }
  }
  if (song.drums && drums) {
    for (const [drum, start] of drums.tokens) {
      events[start].push({ kind: 'drum', drum: drum as Drum, volume: song.drums.volume })
    }
  }
  return { stepSeconds: 60 / song.bpm / 4, steps, events }
}
