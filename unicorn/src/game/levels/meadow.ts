import { MEADOW_SONG } from '../../audio/songs'
import type { TailwindColor } from '../../drawing/colors'
import type { Pixel } from '../../drawing/types'
import { CASTLE, CASTLE_DOOR_LEFT } from '../sprites/castle'
import { CLOUDS } from '../sprites/clouds'
import { RAINBOW_ARC } from '../sprites/rainbow'
import { fieldColumns, settleSnails, stamp, type Field } from '../field'
import { hash, pick, spread, valueNoise } from '../random'
import type { Shape } from '../shape'
import type { Sky } from '../sky'
import { SNAIL_WIDTH } from '../sprites/snail'
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

// Clouds: one chance per chunk of columns, so they're spread out but not evenly. Each is
// placed inside its chunk, so they never overlap.
const CLOUD_CHUNK = 48

// Draws a shape into `grid` (rows of colors, top first) with its top-left corner at
// `left`, `top`. Anything outside the grid is cut off.
function paint(grid: (TailwindColor | null)[][], shape: Shape, left: number, top: number) {
  for (const { x, y, color } of shape.pixels) {
    if (grid[top + y] && left + x >= 0 && left + x < grid[0].length) grid[top + y][left + x] = color
  }
}

function drawClouds(seed: number, grid: (TailwindColor | null)[][]) {
  const width = grid[0].length
  for (let c = 0; c * CLOUD_CHUNK < width; c++) {
    if (hash(seed, c, 10) > 0.65) continue
    const cloud = pick(CLOUDS, hash(seed, c, 12))
    // Where the cloud's flat bottom is, in rows from the top.
    const bottom = 25 + Math.floor(hash(seed, c, 11) * 14)
    const left = c * CLOUD_CHUNK + Math.floor(hash(seed, c, 13) * (CLOUD_CHUNK - cloud.width))
    paint(grid, cloud, left, bottom - cloud.height)
  }
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

// A clear day sky from deep blue at the top to pale blue at the horizon.
const DAY_SKY: Sky = [
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

// The backdrop behind the field: clouds, and a big rainbow in the middle in front of them,
// standing at the bottom.
function generateBackdrop(seed: number, width: number, rows: number): Pixel[] {
  const grid = Array.from({ length: rows }, () => Array<TailwindColor | null>(width).fill(null))
  drawClouds(seed, grid)
  paint(grid, RAINBOW_ARC, Math.floor(width / 2) - RAINBOW_ARC.width / 2, rows - RAINBOW_ARC.height)
  return grid.flatMap((row, y) => row.flatMap((color, x) => (color ? [{ x, y, color }] : [])))
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
