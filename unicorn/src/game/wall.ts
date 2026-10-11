import type { TailwindColor } from '../drawing/colors'
import { hash, pick } from './random'

// An indoor wall right behind the field, darkening up toward the ceiling: courses of
// bricks, or rough cave rock.
export type Wall = (
  | { kind: 'bricks'; bricks: [TailwindColor, TailwindColor]; mortar: TailwindColor }
  | { kind: 'rock'; base: TailwindColor; stones: TailwindColor[] }
) & {
  // The darkness the wall fades into at the top, also the color above the wall.
  ceiling: TailwindColor
}

// A rectangle of color on the wall, in cells.
export type Block = { x: number; y: number; width: number; height: number; color: TailwindColor }

// The color between the blocks.
export function wallBase(wall: Wall) {
  return wall.kind === 'bricks' ? wall.mortar : wall.base
}

// Bricks are 3 rows tall with a row of mortar under each course, and 7 wide with a column
// of mortar after each, offset by half a brick on alternate courses.
const BRICK_HEIGHT = 3
const COURSE = BRICK_HEIGHT + 1
const PITCH = 8

// Rock is blotches of a few tones scattered over the base, about one per this many cells.
const ROCK_DENSITY = 12

// The blocks of a wall `width` by `rows` cells.
export function wallBlocks(seed: number, wall: Wall, width: number, rows: number): Block[] {
  const blocks: Block[] = []
  if (wall.kind === 'rock') {
    for (let i = 0; i < (width * rows) / ROCK_DENSITY; i++) {
      blocks.push({
        x: Math.floor(hash(seed, i, 60) * width),
        y: Math.floor(hash(seed, i, 61) * rows),
        width: 2 + Math.floor(hash(seed, i, 62) * 5),
        height: 1 + Math.floor(hash(seed, i, 63) * 3),
        color: pick(wall.stones, hash(seed, i, 64)),
      })
    }
    return blocks
  }
  for (let course = 0; course * COURSE < rows; course++) {
    const offset = course % 2 === 0 ? 0 : PITCH / 2
    for (let x = -offset; x < width; x += PITCH) {
      const tone = hash(seed, x, course + 50) < 0.3 ? 1 : 0
      blocks.push({
        x,
        y: course * COURSE,
        width: PITCH - 1,
        height: BRICK_HEIGHT,
        color: wall.bricks[tone],
      })
    }
  }
  return blocks
}
