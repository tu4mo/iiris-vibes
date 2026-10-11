import { CASTLE_SONG } from '../../audio/songs'
import type { TailwindColor } from '../../drawing/colors'
import { DRESS_STYLES, DRESS_WIDTH } from '../dress'
import { stamp, type Field, type Pickup } from '../field'
import { hash } from '../random'
import { outlinedPixels, toShapes, type Shape } from '../shape'
import type { Level } from './level'

// The second level, inside the castle: a long hall with dresses hanging on its walls to
// jump for, tall night windows and torches between them, and a black secret passage at
// the far end leading on to the cave.

const WIDTH = 420
const ROWS = 96
const FLOOR = 12

// Dresses start a little into the hall, spaced a random distance apart, and hang a random
// height above the unicorn's head (low enough to reach with a jump of about 18 cells).
const FIRST_DRESS = 44
const DRESS_GAP = { min: 44, max: 58 }
const DRESS_LIFT = { min: 3, max: 9 }

// The passage is near the right end, leaving room for a wide unicorn to walk into it.
const PASSAGE_LEFT = WIDTH - 92
// Walking this far into the passage moves on to the cave.
const PASSAGE_ENTRY = 6

// A checkered floor with a golden edge along the top.
function floorColor(column: number, row: number): TailwindColor | null {
  const depth = row - (ROWS - FLOOR)
  if (depth < 0) return null
  if (depth === 0) return 'amber-300'
  return (Math.floor(column / 4) + Math.floor((depth - 1) / 4)) % 2 === 0
    ? 'violet-200'
    : 'violet-400'
}

// Shapes are built with u = rows up from their base, like the castle and snail.
function shape(
  width: number,
  height: number,
  colorAt: (x: number, u: number) => TailwindColor | null,
) {
  return toShapes([outlinedPixels(width, height, colorAt)]).shapes[0]
}

// A tall arched window onto the night: a stone frame, a cross of leading, and stars.
const WINDOW_WIDTH = 13
const WINDOW_HEIGHT = 30
const WINDOW_ARCH = WINDOW_WIDTH / 2

function windowShape(seed: number): Shape {
  const center = WINDOW_WIDTH / 2
  const archStart = WINDOW_HEIGHT - WINDOW_ARCH
  const inArch = (x: number, u: number, inset: number) => {
    if (x < inset || x >= WINDOW_WIDTH - inset || u < inset) return false
    if (u < archStart) return true
    return Math.hypot(x + 0.5 - center, u + 0.5 - archStart) <= WINDOW_ARCH - inset
  }
  return shape(WINDOW_WIDTH, WINDOW_HEIGHT, (x, u) => {
    if (!inArch(x, u, 0)) return null
    if (!inArch(x, u, 1)) return 'stone-400'
    if (x === Math.floor(center) || u === 12) return 'stone-500'
    if (hash(seed, x, u + 100) < 0.04) return 'amber-100'
    return u > 20 ? 'indigo-950' : u > 8 ? 'indigo-900' : 'violet-900'
  })
}

// A torch in an iron bracket.
const TORCH = shape(5, 10, (x, u) => {
  const dx = Math.abs(x - 2)
  if (u <= 1) return dx <= 1 ? 'slate-600' : null
  if (u <= 4) return dx === 0 ? 'amber-800' : null
  if (u === 5) return dx <= 1 ? 'slate-500' : null
  if (u <= 7) return dx === 0 ? 'amber-200' : dx === 1 ? 'orange-400' : null
  if (u === 8) return dx === 0 ? 'amber-300' : dx === 1 ? 'orange-500' : null
  return dx === 0 ? 'red-500' : null
})

// The secret passage: a pitch-black arch with a few loose dark stones around its edge.
const PASSAGE_WIDTH = 30
const PASSAGE_HEIGHT = 44

function passageShape(seed: number): Shape {
  const center = PASSAGE_WIDTH / 2
  const radius = PASSAGE_WIDTH / 2
  const archStart = PASSAGE_HEIGHT - radius
  // How far a cell is inside the arch's edge: 0 or less is outside.
  const inside = (x: number, u: number) => {
    const side = Math.min(x + 0.5, PASSAGE_WIDTH - x - 0.5)
    if (u < archStart) return side
    return radius - Math.hypot(x + 0.5 - center, u + 0.5 - archStart)
  }
  return shape(PASSAGE_WIDTH, PASSAGE_HEIGHT, (x, u) => {
    const depth = inside(x, u)
    if (depth <= 0) return null
    if (depth < 2 && hash(seed, x, u + 200) < 0.5) return 'stone-600'
    return 'black'
  })
}

function generateField(seed: number): Field {
  const heights = Array.from({ length: WIDTH }, () => FLOOR)
  const columns = Array.from({ length: WIDTH }, (_, column) =>
    Array.from({ length: ROWS }, (_, row) => floorColor(column, row)),
  )

  // Dresses up to a little before the passage, each style in turn from a random start.
  const dresses: Pickup[] = []
  const firstStyle = Math.floor(hash(seed, 0, 40) * DRESS_STYLES.length)
  let left = FIRST_DRESS
  for (let i = 0; left + DRESS_WIDTH < PASSAGE_LEFT - 24; i++) {
    const lift = DRESS_LIFT.min + Math.floor(hash(seed, i, 41) * (DRESS_LIFT.max - DRESS_LIFT.min))
    const style = (firstStyle + i) % DRESS_STYLES.length
    dresses.push({
      kind: 'dress',
      left,
      right: left + DRESS_WIDTH,
      ground: FLOOR,
      lift,
      overHead: true,
      style,
    })
    left += DRESS_GAP.min + Math.floor(hash(seed, i, 42) * (DRESS_GAP.max - DRESS_GAP.min))
  }

  // Between each pair of dresses, and between the last one and the passage, a window or a
  // torch in turn.
  const windowArt = windowShape(seed)
  const ends = [...dresses.map((d) => d.left), PASSAGE_LEFT]
  dresses.forEach((dress, i) => {
    const middle = Math.round((dress.right + ends[i + 1]) / 2)
    if (i % 2 === 0) stamp(columns, windowArt, middle - Math.floor(windowArt.width / 2), FLOOR + 26)
    else stamp(columns, TORCH, middle - Math.floor(TORCH.width / 2), FLOOR + 34)
  })
  stamp(columns, passageShape(seed), PASSAGE_LEFT, FLOOR)

  return {
    width: WIDTH,
    rows: ROWS,
    heights,
    columns,
    exit: PASSAGE_LEFT + PASSAGE_ENTRY,
    snails: [],
    pickups: dresses,
  }
}

export const CASTLE_HALL: Level = {
  width: WIDTH,
  rows: ROWS,
  generate: generateField,
  scenery: {
    kind: 'indoors',
    wall: {
      kind: 'bricks',
      bricks: ['pink-100', 'pink-200'],
      mortar: 'pink-300',
      ceiling: 'indigo-950',
    },
  },
  music: CASTLE_SONG,
  hint: 'Jump with Space to grab the dresses, then find the secret passage.',
}
