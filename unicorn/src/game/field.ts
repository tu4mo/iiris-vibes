import type { TailwindColor } from '../drawing/colors'
import type { Shape } from './shape'
import { SNAIL_HEIGHT, SNAIL_WIDTH } from './snail'

// The ground a level is played on, generated column by column before the level starts.
// Every level builds one of these; the game loop and views only ever see a Field.

// A snail to jump over: column range, and the heights of the ground it sits on and of
// the shell's top, from the bottom.
export type FieldSnail = { left: number; right: number; ground: number; top: number }

// Something to collect by touching it: a dress hanging on a wall, or a diamond. Column
// range, the height of the ground below it, how high it floats (see pickupBottom), and
// which of its kind's styles it is.
export type Pickup = {
  kind: 'dress' | 'diamond'
  left: number
  right: number
  ground: number
  // Cells above the ground, or above the unicorn's head when `overHead` is set, so it
  // takes a jump to reach however tall the unicorn is drawn.
  lift: number
  overHead: boolean
  style: number
}

export type Field = {
  width: number
  rows: number
  // Ground height per column, in cells from the bottom.
  heights: number[]
  // Colors per column, top row first; null is open sky.
  columns: (TailwindColor | null)[][]
  // Walking past this column (the unicorn's left edge) finishes the level.
  exit: number
  // Snails move, so they're drawn separately from `columns`.
  snails: FieldSnail[]
  // Drawn separately too, since they disappear when collected.
  pickups: Pickup[]
}

// Sets each snail on a flat patch at the highest ground beneath it, flattening `heights`.
export function settleSnails(heights: number[], lefts: number[]): FieldSnail[] {
  return lefts.map((left) => {
    const right = left + SNAIL_WIDTH
    const ground = Math.max(...heights.slice(left, right))
    for (let x = left; x < right; x++) heights[x] = ground
    return { left, right, ground, top: ground + SNAIL_HEIGHT }
  })
}

// Draws a shape into the field's columns, standing on the ground `ground` cells high.
export function stamp(
  columns: (TailwindColor | null)[][],
  shape: Shape,
  left: number,
  ground: number,
) {
  const top = columns[0].length - ground - shape.height
  for (const { x, y, color } of shape.pixels) {
    const column = left + x
    const row = top + y
    if (column >= 0 && column < columns.length && row >= 0) columns[column][row] = color
  }
}
