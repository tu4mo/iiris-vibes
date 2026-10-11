import { MEADOW_SONG } from '../../audio/songs'
import type { TailwindColor } from '../../drawing/colors'
import type { Pixel } from '../../drawing/types'
import { CASTLE, CASTLE_DOOR_LEFT } from '../castle'
import { fieldColumns, settleSnails, stamp, type Field } from '../field'
import { hash, pick, spread, valueNoise } from '../random'
import { DAY_SKY, rainbowColor, type Sky } from '../sky'
import { SNAIL_WIDTH } from '../snail'
import type { Level } from './level'

// The first level: a rolling green field under a rainbow, with snails to jump over and a
// castle at the far end. Evening falls on the way there.

const WIDTH = 900
const ROWS = 96

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
    // The lowest puff covering the cell is in front.
    let front: Puff | undefined
    for (const p of cloud.puffs) if (inPuff(p, column, row) && (!front || p.y > front.y)) front = p
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
// Rows count from the top.
function cellColor(
  seed: number,
  column: number,
  row: number,
  height: number,
): TailwindColor | null {
  const groundTop = ROWS - height
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

// Evening near the castle: dusky violet at the top, red and orange at the horizon.
const DUSK_SKY: Sky = [
  'indigo-600',
  'violet-500',
  'purple-500',
  'fuchsia-500',
  'rose-500',
  'red-400',
  'orange-400',
  'amber-300',
]

// The backdrop behind the field: clouds and a big rainbow, as pixels.
const RAINBOW_BAND = 3

function generateBackdrop(seed: number, width: number, rows: number): Pixel[] {
  const pixels: Pixel[] = []
  const clouds = generateClouds(seed, width)
  // The arc's center sits below the horizon, so its ends disappear behind the hills.
  const center = { x: width / 2, y: rows - 14 }
  const outer = Math.min(rows - 24, width / 2 - 4)
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < width; x++) {
      const color = rainbowColor(center, outer, RAINBOW_BAND, x, y) ?? cloudColor(clouds, x, y)
      if (color) pixels.push({ x, y, color })
    }
  }
  return pixels
}

// The castle stands near the right end, on flat ground that starts a little before it.
const CASTLE_MARGIN = 6
const CASTLE_GROUND = 16
const FLAT_APPROACH = 10

// Snails start a little into the field (give or take) and stop before the castle's approach.
const FIRST_SNAIL = 70
const SNAIL_GAP = { min: 45, max: 80 }

function generateField(seed: number): Field {
  const castleLeft = WIDTH - CASTLE_MARGIN - CASTLE.width
  const heights = Array.from({ length: WIDTH }, (_, column) =>
    column >= castleLeft - FLAT_APPROACH ? CASTLE_GROUND : groundHeight(seed, column),
  )
  const firstSnail = FIRST_SNAIL + Math.floor(hash(seed, 0, 31) * 20)
  const lastSnail = castleLeft - FLAT_APPROACH - 20 - SNAIL_WIDTH
  const snails = settleSnails(heights, spread(seed, 30, firstSnail, lastSnail, SNAIL_GAP))

  const columns = fieldColumns(WIDTH, ROWS, (column, row) =>
    cellColor(seed, column, row, heights[column]),
  )
  stamp(columns, CASTLE, castleLeft, CASTLE_GROUND)

  // Walking into the castle's doorway finishes the level.
  return {
    width: WIDTH,
    rows: ROWS,
    heights,
    columns,
    exit: castleLeft + CASTLE_DOOR_LEFT,
    snails,
    pickups: [],
  }
}

export const MEADOW: Level = {
  generate: generateField,
  scenery: {
    kind: 'outdoors',
    sky: DAY_SKY,
    skyAtExit: DUSK_SKY,
    shadeAtExit: 0.25,
    backdrop: generateBackdrop,
  },
  music: MEADOW_SONG,
  hint: 'Walk to the castle with ← and →, and jump over snails with Space.',
}
