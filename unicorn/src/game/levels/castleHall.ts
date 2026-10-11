import { CASTLE_SONG } from '../../audio/songs'
import type { TailwindColor } from '../../drawing/colors'
import { DRESS_STYLES, DRESS_WIDTH } from '../sprites/dress'
import { PASSAGE } from '../sprites/passage'
import { TORCH } from '../sprites/torch'
import { WINDOW } from '../sprites/window'
import { fieldColumns, stamp, type Field, type Pickup } from '../field'
import { hash, spread } from '../random'
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

function generateField(seed: number): Field {
  const heights = Array.from({ length: WIDTH }, () => FLOOR)
  const columns = fieldColumns(WIDTH, ROWS, floorColor)

  // Dresses up to a little before the passage, each style in turn from a random start.
  const firstStyle = Math.floor(hash(seed, 0, 40) * DRESS_STYLES.length)
  const lefts = spread(seed, 42, FIRST_DRESS, PASSAGE_LEFT - 24 - DRESS_WIDTH, DRESS_GAP)
  const dresses = lefts.map((left, i): Pickup => ({
    kind: 'dress',
    left,
    right: left + DRESS_WIDTH,
    ground: FLOOR,
    lift: DRESS_LIFT.min + Math.floor(hash(seed, i, 41) * (DRESS_LIFT.max - DRESS_LIFT.min)),
    overHead: true,
    style: (firstStyle + i) % DRESS_STYLES.length,
  }))

  // Between each pair of dresses, and between the last one and the passage, a window or a
  // torch in turn.
  const ends = [...dresses.map((d) => d.left), PASSAGE_LEFT]
  dresses.forEach((dress, i) => {
    const middle = Math.round((dress.right + ends[i + 1]) / 2)
    if (i % 2 === 0) stamp(columns, WINDOW, middle - Math.floor(WINDOW.width / 2), FLOOR + 26)
    else stamp(columns, TORCH, middle - Math.floor(TORCH.width / 2), FLOOR + 34)
  })
  stamp(columns, PASSAGE, PASSAGE_LEFT, FLOOR)

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
