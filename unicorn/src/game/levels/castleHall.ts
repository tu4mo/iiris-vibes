import type { TailwindColor } from '../../drawing/colors'
import type { Field } from '../field'
import { hash, pick } from '../random'
import type { Sky } from '../sky'
import type { Level } from './level'

// The second level, inside the castle. For now a placeholder: a long hall with a flat stone
// floor and a way out at the far end, so the level structure has something to move on to.

const WIDTH = 320
const ROWS = 96
const FLOOR = 12
// The way out, this far from the hall's right end (leaving room for a wide unicorn).
const EXIT_MARGIN = 60

// The hall's back wall, dim at the top and lit warmer near the floor.
const HALL_WALL: Sky = [
  'indigo-950',
  'indigo-900',
  'violet-900',
  'violet-800',
  'purple-800',
  'fuchsia-900',
  'pink-900',
  'rose-900',
]

function cellColor(seed: number, column: number, row: number): TailwindColor | null {
  const depth = row - (ROWS - FLOOR)
  if (depth < 0) return null
  if (depth === 0) return 'violet-300'
  return pick(['violet-200', 'violet-300', 'pink-200'], hash(seed, column, row))
}

function generateField(seed: number): Field {
  return {
    width: WIDTH,
    rows: ROWS,
    heights: Array.from({ length: WIDTH }, () => FLOOR),
    columns: Array.from({ length: WIDTH }, (_, column) =>
      Array.from({ length: ROWS }, (_, row) => cellColor(seed, column, row)),
    ),
    exit: WIDTH - EXIT_MARGIN,
    snails: [],
  }
}

export const CASTLE_HALL: Level = {
  width: WIDTH,
  rows: ROWS,
  generate: generateField,
  sky: HALL_WALL,
  hint: 'Explore the castle with ← and →, and jump with Space.',
  exitTitle: 'You made it through the castle!',
}
