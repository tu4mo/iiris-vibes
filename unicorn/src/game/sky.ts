import type { TailwindColor } from '../drawing/colors'

// A sky: colored bands from the top of the level down to the horizon.
export type Sky = TailwindColor[]

// A sky band, from row `top` down to (not including) row `bottom`.
type SkyBand = { color: TailwindColor; top: number; bottom: number }

// The sky's bands, top to bottom. They're equal heights, and the last one takes up the rest.
export function skyBands(rows: number, sky: Sky): SkyBand[] {
  const bandHeight = Math.max(2, Math.floor((rows * 0.85) / sky.length))
  return sky.map((color, i) => ({
    color,
    top: i * bandHeight,
    bottom: i < sky.length - 1 ? (i + 1) * bandHeight : Math.max(rows, i * bandHeight),
  }))
}

// A clear day sky from deep blue at the top to pale blue at the horizon.
export const DAY_SKY: Sky = [
  'blue-500',
  'blue-400',
  'blue-300',
  'sky-300',
  'sky-200',
  'cyan-100',
  'sky-100',
  'blue-50',
]
