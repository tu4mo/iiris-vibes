import type { TailwindColor } from '../drawing/colors'
import type { Pixel } from '../drawing/types'
import { CASTLE, CASTLE_DOOR_LEFT } from './castle'
import type { Shape } from './shape'
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

// Clouds: one chance per chunk of columns, so they're spread out but not evenly.
const CLOUD_CHUNK = 48

// A cloud is a row of round puffs, biggest in the middle, cut off flat at the bottom.
type Puff = { x: number; y: number; radius: number }
type Cloud = { bottom: number; puffs: Puff[] }

function generateClouds(seed: number, width: number): Cloud[] {
  const clouds: Cloud[] = []
  for (let c = 0; c * CLOUD_CHUNK < width; c++) {
    if (hash(seed, c, 10) > 0.65) continue
    const bottom = 25 + Math.floor(hash(seed, c, 11) * 14)
    const count = 4 + Math.floor(hash(seed, c, 12) * 3)
    const puffs: Puff[] = []
    let x = (c + 0.2 + hash(seed, c, 13) * 0.3) * CLOUD_CHUNK
    for (let i = 0; i < count; i++) {
      // 0 at the ends, 1 in the middle.
      const middle = 1 - Math.abs((2 * i) / (count - 1) - 1)
      const radius = 3.5 + middle * 4 + hash(seed, c * 8 + i, 14) * 2
      if (i > 0) x += (puffs[i - 1].radius + radius) * 0.6
      // The middle puffs ride higher, so the cloud piles up into a mound.
      const lift = middle * 4 + hash(seed, c * 8 + i, 15) * 2
      puffs.push({ x, y: bottom - radius * 0.5 - lift, radius })
    }
    clouds.push({ bottom, puffs })
  }
  return clouds
}

const inPuff = (p: Puff, column: number, row: number) =>
  Math.hypot(column + 0.5 - p.x, row + 0.5 - p.y) <= p.radius

// A cloud cell's color. Lower puffs overlap higher ones, and each puff is lit from the top
// left: white there, with a crescent of shade on its lower right. The flat bottom is shaded too.
function cloudColor(clouds: Cloud[], column: number, row: number): TailwindColor | null {
  for (const cloud of clouds) {
    if (row >= cloud.bottom) continue
    const front = cloud.puffs.filter((p) => inPuff(p, column, row)).sort((a, b) => b.y - a.y)[0]
    if (!front) continue
    if (row === cloud.bottom - 1) return 'blue-200'
    if (row === cloud.bottom - 2) return 'sky-200'
    // The lit part is the puff's circle nudged up and left; the crescent outside it is shade.
    const lit = { ...front, x: front.x - front.radius * 0.2, y: front.y - front.radius * 0.3 }
    if (!inPuff(lit, column, row)) return 'sky-100'
    return 'white'
  }
  return null
}

// The color of a field cell, or null for open sky (the layers behind show through).
// Rows count from the top of a field `rows` tall.
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

// A sky band, from row `top` down to (not including) row `bottom`.
export type SkyBand = { color: TailwindColor; top: number; bottom: number }

// The sky's bands, top to bottom. They're equal heights, and the last one takes up the rest.
export function skyBands(rows: number, sky: TailwindColor[]): SkyBand[] {
  const bandHeight = Math.max(2, Math.floor((rows * 0.85) / sky.length))
  return sky.map((color, i) => ({
    color,
    top: i * bandHeight,
    bottom: i < sky.length - 1 ? (i + 1) * bandHeight : Math.max(rows, i * bandHeight),
  }))
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

export function generateBackdrop(seed: number, width: number, rows: number): Pixel[] {
  const pixels: Pixel[] = []
  const clouds = generateClouds(seed, width)
  // The arc's center sits below the horizon, so its ends disappear behind the hills.
  const center = { x: width / 2, y: rows - 14 }
  const outer = Math.min(rows - 24, width / 2 - 4)
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < width; x++) {
      const distance = Math.hypot(x + 0.5 - center.x, y + 0.5 - center.y)
      const band = Math.floor((outer - distance) / RAINBOW_BAND)
      if (band >= 0 && band < RAINBOW.length) pixels.push({ x, y, color: RAINBOW[band] })
      else {
        const color = cloudColor(clouds, x, y)
        if (color) pixels.push({ x, y, color })
      }
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
  // The castle doorway's left column; walking into it ends the game.
  doorLeft: number
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

// Draws a shape into the field's columns, standing on the ground `ground` cells high.
function stamp(columns: (TailwindColor | null)[][], shape: Shape, left: number, ground: number) {
  const top = columns[0].length - ground - shape.height
  for (const { x, y, color } of shape.pixels) {
    const column = left + x
    const row = top + y
    if (column >= 0 && column < columns.length && row >= 0) columns[column][row] = color
  }
}

export function generateField(seed: number, width: number, rows: number): Field {
  const castleLeft = width - CASTLE_MARGIN - CASTLE.width
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
  stamp(columns, CASTLE, castleLeft, CASTLE_GROUND)

  return { width, rows, heights, columns, doorLeft: castleLeft + CASTLE_DOOR_LEFT, snails }
}
