import { CAVE_SONG } from '../../audio/songs'
import type { TailwindColor } from '../../drawing/colors'
import { DIAMOND_SHAPES } from '../sprites/diamond'
import { fieldColumns, type Field, type Pickup } from '../field'
import { hash, pick, spread, valueNoise } from '../random'
import { clamp } from '../math'
import { archDepth } from '../shape'
import { DAY_SKY, rainbowColor, skyColorAt } from '../sky'
import type { Level } from './level'

// The third level, through the castle's secret passage: a dark cave with rocky ups and
// downs and diamonds along the way. At the far end, an opening looks out on the sunny
// field from the first level; walking out through it starts the game over.

const WIDTH = 520
const ROWS = 96

// The opening near the right end, leaving room for a wide unicorn to walk into it.
const OPENING = { width: 40, height: 54 }
const OPENING_LEFT = WIDTH - 72
// Walking this far into the opening goes back out to the field.
const OPENING_ENTRY = 8
// The ground levels out on the way to the opening, over this many columns.
const LEVEL_OUT = { from: OPENING_LEFT - 44, over: 24 }
const OPENING_GROUND = 14

// Diamonds start a little into the cave, spaced a random distance apart. Some sit low
// enough to walk into; the rest float just above the unicorn's head.
const FIRST_DIAMOND = 30
const DIAMOND_GAP = { min: 18, max: 30 }
const HIGH_CHANCE = 0.55

const GROUND_ROCK: TailwindColor[] = ['stone-700', 'stone-800', 'zinc-700']
const CEILING_ROCK: TailwindColor[] = ['stone-800', 'zinc-800', 'stone-700']
const CRYSTALS: TailwindColor[] = ['cyan-300', 'violet-400', 'fuchsia-400']

// Height of the cave floor at a column, in cells from the bottom: rocky hills that level
// out before the opening.
function groundHeight(seed: number, column: number) {
  const rocky = 10 + valueNoise(seed, column, 18, 70) * 14 + valueNoise(seed, column, 6, 71) * 3
  const t = clamp((column - LEVEL_OUT.from) / LEVEL_OUT.over, 0, 1)
  return Math.round(rocky * (1 - t) + OPENING_GROUND * t)
}

// How far the ceiling reaches down at a column, in rows from the top: an uneven roof with
// stalactites hanging from it, one chance per chunk of columns.
const STALACTITE_CHUNK = 14

function ceilingDepth(seed: number, column: number) {
  const roof = 8 + valueNoise(seed, column, 11, 72) * 8
  const chunk = Math.floor(column / STALACTITE_CHUNK)
  let spike = 0
  if (hash(seed, chunk, 73) < 0.5) {
    const center = chunk * STALACTITE_CHUNK + 3 + hash(seed, chunk, 74) * 8
    const length = 3 + hash(seed, chunk, 75) * 5
    spike = length * (1 - Math.abs(column + 0.5 - center) / 3)
  }
  return Math.round(roof + Math.max(0, spike))
}

// The cave's rock, or null for open space (the wall behind shows through). Rows count
// from the top.
function rockColor(
  seed: number,
  column: number,
  row: number,
  ground: number,
  ceiling: number,
): TailwindColor | null {
  const r = hash(seed, column, row)
  if (row < ceiling) return row === ceiling - 1 ? 'stone-600' : pick(CEILING_ROCK, r)
  const depth = row - (ROWS - ground)
  if (depth === 0) return 'stone-500'
  if (depth > 0) return depth < 3 ? 'stone-600' : pick(GROUND_ROCK, r)
  // Small glowing crystals poke up from the floor here and there.
  const crystal = hash(seed, column, 76)
  if (depth === -1 && crystal < 0.04) return pick(CRYSTALS, crystal / 0.04)
  if (depth === -2 && crystal < 0.015) return pick(CRYSTALS, crystal / 0.04)
  return null
}

// The way out: an arch looking onto the field from the first level, with the day sky, a
// slice of the rainbow and green hills, and a daylit rim of rock around its edge.
function paintOpening(seed: number, columns: (TailwindColor | null)[][]) {
  const floorRow = ROWS - OPENING_GROUND
  const rainbow = { center: { x: OPENING.width / 2 + 12, y: -6 }, outer: 34, bandWidth: 2 }

  for (let x = -2; x < OPENING.width + 2; x++) {
    const column = columns[OPENING_LEFT + x]
    const hill = Math.round(4 + valueNoise(seed, x, 9, 77) * 8)
    for (let u = 0; u < OPENING.height + 2; u++) {
      const row = floorRow - 1 - u
      const depth = archDepth(OPENING.width, OPENING.height, x, u)
      if (depth <= -2) continue
      // A rim of rock around the edge, lit by the daylight coming in.
      if (depth <= 0) {
        column[row] = depth > -1 ? 'stone-300' : 'stone-500'
        continue
      }
      if (u < hill) {
        const flower = hash(seed, x, 78)
        column[row] =
          u === hill - 1
            ? flower < 0.15
              ? 'rose-400'
              : 'lime-400'
            : pick(['green-500', 'green-600'], hash(seed, x, u))
      } else {
        column[row] =
          rainbowColor(rainbow.center, rainbow.outer, rainbow.bandWidth, x, u) ??
          skyColorAt(ROWS, DAY_SKY, row)
      }
    }
    // Grass grows on the floor in the sunlight.
    if (x >= 0 && x < OPENING.width) {
      column[floorRow] = 'lime-400'
      column[floorRow + 1] = 'green-500'
    }
  }
}

function placeDiamonds(seed: number, heights: number[]): Pickup[] {
  return spread(seed, 83, FIRST_DIAMOND, OPENING_LEFT - 30, DIAMOND_GAP).map((left, i) => {
    const style = Math.floor(hash(seed, i, 80) * DIAMOND_SHAPES.length)
    const right = left + DIAMOND_SHAPES[style].width
    const overHead = hash(seed, i, 81) < HIGH_CHANCE
    return {
      kind: 'diamond',
      left,
      right,
      // Above the highest rock near it, so it never sits inside a hill.
      ground: Math.max(...heights.slice(left - 4, right + 4)),
      lift: 2 + Math.floor(hash(seed, i, 82) * (overHead ? 8 : 6)),
      overHead,
      style,
    }
  })
}

function generateField(seed: number): Field {
  const heights = Array.from({ length: WIDTH }, (_, column) => groundHeight(seed, column))
  const ceilings = heights.map((_, column) => ceilingDepth(seed, column))
  const columns = fieldColumns(WIDTH, ROWS, (column, row) =>
    rockColor(seed, column, row, heights[column], ceilings[column]),
  )
  paintOpening(seed, columns)

  return {
    width: WIDTH,
    rows: ROWS,
    heights,
    columns,
    exit: OPENING_LEFT + OPENING_ENTRY,
    snails: [],
    pickups: placeDiamonds(seed, heights),
  }
}

export const CAVE: Level = {
  generate: generateField,
  scenery: {
    kind: 'indoors',
    wall: {
      kind: 'rock',
      base: 'zinc-900',
      stones: ['stone-900', 'zinc-800', 'neutral-900', 'stone-800'],
      ceiling: 'black',
    },
  },
  music: CAVE_SONG,
  hint: 'Follow the passage over the rocks, collect the diamonds, and find the way out.',
}
