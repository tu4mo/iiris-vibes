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

// The sky's color at a row, for a sky `rows` tall.
export function skyColorAt(rows: number, sky: Sky, row: number): TailwindColor {
  return skyBands(rows, sky).find((b) => row >= b.top && row < b.bottom)?.color ?? sky.at(-1)!
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

export const RAINBOW: TailwindColor[] = [
  'red-400',
  'orange-400',
  'amber-300',
  'green-400',
  'sky-400',
  'indigo-400',
  'violet-400',
]

// The rainbow's color at a cell, for an arc centered on `center` whose outer edge is
// `outer` cells away, with bands `bandWidth` cells wide. Null outside the arc.
export function rainbowColor(
  center: { x: number; y: number },
  outer: number,
  bandWidth: number,
  x: number,
  y: number,
): TailwindColor | null {
  const band = Math.floor((outer - Math.hypot(x + 0.5 - center.x, y + 0.5 - center.y)) / bandWidth)
  return band >= 0 && band < RAINBOW.length ? RAINBOW[band] : null
}
