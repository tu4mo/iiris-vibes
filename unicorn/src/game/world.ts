import type { TailwindColor } from '../drawing/colors'
import { CASTLE_WIDTH, DOOR_LEFT, DOOR_WIDTH, castlePixels } from './castle'
import { SNAIL_HEIGHT, SNAIL_WIDTH } from './snail'

// A rolling green field, generated column by column from a seed before the game starts.

// Deterministic pseudo-random number in [0, 1) for a seed and up to two coordinates.
function hash(seed: number, a: number, b = 0): number {
  let h = seed ^ Math.imul(a, 374761393) ^ Math.imul(b, 668265263)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

function pick<T>(items: readonly T[], r: number): T {
  return items[Math.floor(r * items.length)]
}

// Smooth noise: random heights every `spacing` columns, eased in between.
function valueNoise(seed: number, column: number, spacing: number, salt: number) {
  const k = Math.floor(column / spacing)
  const t = column / spacing - k
  const eased = t * t * (3 - 2 * t)
  const a = hash(seed, k, salt)
  const b = hash(seed, k + 1, salt)
  return a + (b - a) * eased
}

// Height of the ground at a column, in cells from the bottom.
function groundHeight(seed: number, column: number) {
  const hills = valueNoise(seed, column, 14, 1)
  const bumps = valueNoise(seed, column, 5, 2)
  return Math.round(12 + hills * 10 + bumps * 2)
}

const FLOWERS: TailwindColor[] = ['rose-400', 'amber-300', 'violet-400', 'pink-300', 'white']

// Clouds are seeded per 24-column chunk; a cloud can spill into neighbouring chunks.
const CLOUD_CHUNK = 24

function isCloud(seed: number, column: number, row: number) {
  const chunk = Math.floor(column / CLOUD_CHUNK)
  for (let c = chunk - 1; c <= chunk + 1; c++) {
    if (hash(seed, c, 10) > 0.6) continue
    const cx = c * CLOUD_CHUNK + hash(seed, c, 11) * CLOUD_CHUNK
    const cy = 6 + hash(seed, c, 12) * 14
    const halfWidth = 4 + hash(seed, c, 13) * 5
    const halfHeight = 1.5 + hash(seed, c, 14) * 1.5
    const dx = (column + 0.5 - cx) / halfWidth
    const dy = (row + 0.5 - cy) / halfHeight
    if (dx * dx + dy * dy <= 1) return true
  }
  return false
}

// The color of a world cell. Rows count from the top of a view `rows` tall.
// The color of a field cell, or null for open sky (the layers behind show through).
function cellColor(
  seed: number,
  column: number,
  row: number,
  rows: number,
  height: number,
): TailwindColor | null {
  const groundTop = rows - height
  const depth = row - groundTop

  if (depth >= 0) {
    const r = hash(seed, column, row)
    if (depth === 0) return pick(['lime-400', 'green-400'], r)
    if (depth < 3) return pick(['green-400', 'green-500'], r)
    if (depth < 8) return pick(['green-500', 'green-600'], r)
    return pick(['green-600', 'green-700', 'emerald-700'], r)
  }

  // Flowers and grass tufts sit one cell above the ground.
  if (depth === -1) {
    const r = hash(seed, column, 7)
    if (r < 0.07) return pick(FLOWERS, r / 0.07)
    if (r < 0.2) return 'green-500'
  }

  return null
}

// Skies as pixel-art bands, top to bottom, with a checkerboard dither where two bands meet.
// A clear day sky from deep blue at the top to pale blue at the horizon.
export const DAY_SKY: TailwindColor[] = [
  'blue-500',
  'blue-400',
  'blue-300',
  'sky-300',
  'sky-200',
  'cyan-100',
  'sky-100',
  'blue-50',
]

// Evening near the castle: dusky violet at the top, red and orange at the horizon.
export const DUSK_SKY: TailwindColor[] = [
  'indigo-600',
  'violet-500',
  'purple-500',
  'fuchsia-500',
  'rose-500',
  'red-400',
  'orange-400',
  'amber-300',
]

export type SkyRow = { color: TailwindColor; dither?: TailwindColor }

// The sky row by row. The last row of each band is dithered with the next band's color.
export function skyRows(rows: number, sky: TailwindColor[]): SkyRow[] {
  const bandHeight = Math.max(2, Math.floor((rows * 0.85) / sky.length))
  return Array.from({ length: rows }, (_, row) => {
    const band = Math.min(sky.length - 1, Math.floor(row / bandHeight))
    const lastRowOfBand = row % bandHeight === bandHeight - 1
    return lastRowOfBand && band < sky.length - 1
      ? { color: sky[band], dither: sky[band + 1] }
      : { color: sky[band] }
  })
}

// The backdrop behind the field: clouds and a big rainbow, as pixels. It scrolls slower
// than the field for parallax, so it only needs to be `width` columns wide.
const RAINBOW: TailwindColor[] = [
  'red-400',
  'orange-400',
  'amber-300',
  'green-400',
  'sky-400',
  'indigo-400',
  'violet-400',
]
const RAINBOW_BAND = 3

export type BackdropPixel = { x: number; y: number; color: TailwindColor }

export function generateBackdrop(seed: number, width: number, rows: number): BackdropPixel[] {
  const pixels: BackdropPixel[] = []
  // The arc's center sits below the horizon, so its ends disappear behind the hills.
  const center = { x: width / 2, y: rows - 14 }
  const outer = Math.min(rows - 24, width / 2 - 4)
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < width; x++) {
      const distance = Math.hypot(x + 0.5 - center.x, y + 0.5 - center.y)
      const band = Math.floor((outer - distance) / RAINBOW_BAND)
      if (band >= 0 && band < RAINBOW.length) pixels.push({ x, y, color: RAINBOW[band] })
      else if (isCloud(seed, x, y)) pixels.push({ x, y, color: 'white' })
    }
  }
  return pixels
}

export type Field = {
  width: number
  rows: number
  // Ground height per column, in cells from the bottom.
  heights: number[]
  // Colors per column, top row first; null is open sky.
  columns: (TailwindColor | null)[][]
  // The castle doorway's column range; walking into it ends the game.
  door: { left: number; right: number }
  // Snails to jump over: column range, and the heights of the ground they sit on and of the
  // shell's top, from the bottom. They move, so they're drawn separately from `columns`.
  snails: { left: number; right: number; ground: number; top: number }[]
}

// The castle stands near the right end, on flat ground that starts a little before it.
const CASTLE_MARGIN = 6
const CASTLE_GROUND = 16
const FLAT_APPROACH = 10

// Snails start a little into the field and stop before the castle's approach,
// spaced a random distance apart.
const FIRST_SNAIL = 70
const SNAIL_GAP = { min: 45, max: 80 }

function placeSnails(seed: number, from: number, to: number) {
  const lefts: number[] = []
  let x = from + Math.floor(hash(seed, 0, 30) * 20)
  for (let i = 1; x + SNAIL_WIDTH < to; i++) {
    lefts.push(x)
    x += SNAIL_GAP.min + Math.floor(hash(seed, i, 30) * (SNAIL_GAP.max - SNAIL_GAP.min))
  }
  return lefts
}

function stamp(
  columns: (TailwindColor | null)[][],
  pixels: Map<string, TailwindColor>,
  left: number,
  ground: number,
) {
  const rows = columns[0].length
  for (const [key, color] of pixels) {
    const [x, u] = key.split(',').map(Number)
    const column = left + x
    const row = rows - ground - 1 - u
    if (column >= 0 && column < columns.length && row >= 0) columns[column][row] = color
  }
}

export function generateField(seed: number, width: number, rows: number): Field {
  const castleLeft = width - CASTLE_MARGIN - CASTLE_WIDTH
  const heights = Array.from({ length: width }, (_, column) =>
    column >= castleLeft - FLAT_APPROACH ? CASTLE_GROUND : groundHeight(seed, column),
  )

  // Each snail sits on a flat patch at the highest ground beneath it.
  const snails = placeSnails(seed, FIRST_SNAIL, castleLeft - FLAT_APPROACH - 20).map((left) => {
    const right = left + SNAIL_WIDTH
    const ground = Math.max(...heights.slice(left, right))
    for (let x = left; x < right; x++) heights[x] = ground
    return { left, right, ground, top: ground + SNAIL_HEIGHT }
  })

  const columns = Array.from({ length: width }, (_, column) =>
    Array.from({ length: rows }, (_, row) => cellColor(seed, column, row, rows, heights[column])),
  )
  stamp(columns, castlePixels(), castleLeft, CASTLE_GROUND)

  const doorLeft = castleLeft + DOOR_LEFT
  return {
    width,
    rows,
    heights,
    columns,
    door: { left: doorLeft, right: doorLeft + DOOR_WIDTH },
    snails,
  }
}
