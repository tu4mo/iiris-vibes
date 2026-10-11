import type { Song } from './song'

// The music for each level, all original. Each loops after eight bars.

// A chord broken into sixteenth notes, up and back down, for `steps` steps.
function arpeggio(chord: string[], steps = 16) {
  const order = [0, 1, 2, 1]
  return Array.from({ length: steps }, (_, i) => chord[order[i % 4]]).join(' ')
}

const C = ['C4', 'E4', 'G4']
const Am = ['A3', 'C4', 'E4']
const F = ['A3', 'C4', 'F4']
const G = ['B3', 'D4', 'G4']

// The field: a bouncy, cheerful tune in C major over C, Am, F and G, with a skipping
// bass, sparkling arpeggios and a backbeat.
export const MEADOW_SONG: Song = {
  bpm: 140,
  voices: [
    {
      wave: 'pulse25',
      volume: 0.5,
      decay: 0.2,
      sustain: 0.6,
      notes: `
        E5:2 G5:2 C6:2 G5:2 A5:2 G5:2 E5:4 |
        C5:2 E5:2 A5:3 G5:1 E5:2 C5:2 D5:4 |
        F5:2 A5:2 C6:2 A5:2 G5:2 F5:2 E5:2 F5:2 |
        G5:3 F5:1 E5:2 D5:2 B4:2 D5:2 G5:4 |
        E5:2 G5:2 C6:2 E6:2 D6:2 C6:2 G5:4 |
        A5:2 C6:2 E6:3 D6:1 C6:2 A5:2 E5:4 |
        F5:2 A5:2 C6:4 B5:2 A5:2 G5:2 B5:2 |
        C6:4 G5:2 E5:2 C5:4 -:4`,
    },
    {
      wave: 'pulse12',
      volume: 0.18,
      decay: 0.08,
      sustain: 0.3,
      notes: [
        arpeggio(C),
        arpeggio(Am),
        arpeggio(F),
        arpeggio(G),
        arpeggio(C),
        arpeggio(Am),
        `${arpeggio(F, 8)} ${arpeggio(G, 8)}`,
        arpeggio(C),
      ].join(' | '),
    },
    {
      wave: 'triangle',
      volume: 0.9,
      decay: 0.15,
      sustain: 0.5,
      unit: 2,
      notes: `
        C3 C4 G3 C4 C3 C4 G3 C4 | A2 A3 E3 A3 A2 A3 E3 A3 |
        F2 F3 C3 F3 F2 F3 C3 F3 | G2 G3 D3 G3 G2 G3 D3 G3 |
        C3 C4 G3 C4 C3 C4 G3 C4 | A2 A3 E3 A3 A2 A3 E3 A3 |
        F2 F3 C3 F3 G2 G3 D3 G3 | C3 C4 G3 C4 C3 C4 G2 B2`,
    },
  ],
  drums: { volume: 0.5, hits: 'k - h - s - h - k k h - s - h h | '.repeat(8) },
}

// The castle: a baroque two-part invention in D major, harpsichord-like runs of
// sixteenths over a walking bass, through D, A, Bm, F#m, G, D, G-A, D.
export const CASTLE_SONG: Song = {
  bpm: 96,
  voices: [
    {
      wave: 'pulse25',
      volume: 0.8,
      decay: 0.18,
      sustain: 0.2,
      notes: `
        D5 E5 F#5 G5 A5 F#5 D5 F#5 A5 B5 A5 G5 F#5 E5 D5 C#5 |
        E5 C#5 A4 C#5 E5 A5 G5 F#5 E5 D5 C#5 B4 A4 B4 C#5 A4 |
        B4 D5 F#5 D5 B4 D5 F#5 B5 A5 G5 F#5 E5 D5 C#5 B4 D5 |
        C#5 E5 A5 E5 C#5 F#5 A5 C#6 B5 A5 F#5 E5 D5 C#5 B4 C#5 |
        D5 G5 B5 G5 D5 G5 B5 D6 D6 B5 G5 B5 D6 B5 G5 D5 |
        F#5 A5 D6 A5 F#5 A5 D6 F#6 E6 D6 C#6 B5 A5 G5 F#5 E5 |
        G5 B5 D6 B5 G5 F#5 E5 D5 C#5 E5 A5 E5 C#5 D5 E5 C#5 |
        D5 F#5 A5 D6 A5 F#5 D5 A4 D5:8`,
    },
    {
      wave: 'pulse50',
      volume: 0.55,
      decay: 0.25,
      sustain: 0.25,
      unit: 2,
      notes: `
        D3 D4 C#4 D4 A3 F#3 D3 F#3 | A2 A3 G#3 A3 E3 C#3 A2 C#3 |
        B2 B3 A3 B3 F#3 D3 B2 D3 | F#2 F#3 E3 F#3 C#3 A2 F#2 A2 |
        G2 G3 F#3 G3 D3 B2 G2 B2 | D3 D4 C#4 D4 A3 F#3 D3 F#3 |
        G2 B2 D3 G3 A2 C#3 E3 A3 | D3 A2 F#2 A2 D3:8`,
    },
  ],
}

// The cave: slow and a bit spooky, in A minor. A low creeping bass with a tritone in it,
// a thin wavering melody that echoes off the rock, and water dripping now and then.
export const CAVE_SONG: Song = {
  bpm: 76,
  voices: [
    {
      wave: 'pulse12',
      volume: 0.35,
      decay: 0.6,
      sustain: 0.5,
      echo: { delay: 3, volume: 0.35 },
      vibrato: { depth: 12, rate: 5 },
      notes: `
        A4:6 C5:2 E5:4 D#5:4 | E5:8 -:8 |
        F5:6 E5:2 D#5:4 A4:4 | B4:8 G#4:8 |
        A5:6 G5:2 F5:4 E5:4 | D#5:4 E5:4 C5:8 |
        D5:4 F5:4 A5:4 G#5:4 | A5:12 -:4`,
    },
    {
      wave: 'triangle',
      volume: 0.9,
      decay: 0.8,
      sustain: 0.6,
      unit: 4,
      notes: `
        A2 E3 F3 E3 | A2 E3 F3 E3 | D3 A2 D#3 A2 | E3 B2 G#2 B2 |
        A2 E3 F3 E3 | A2 E3 F3 E3 | D3 A2 D#3 A2 | E3 B2 G#2 E2`,
    },
  ],
  drums: {
    volume: 0.4,
    hits: `
      -:6 d -:9 | -:16 | -:11 d -:4 | -:16 |
      -:3 d -:12 | -:16 | -:8 d -:3 d -:3 | -:16`,
  },
}
