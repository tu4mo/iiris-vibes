import type { TailwindColor } from '../drawing/colors'
import { hash } from './random'

// An indoor wall right behind the field: courses of bricks, darkening up toward the ceiling.
export type Wall = {
  bricks: [TailwindColor, TailwindColor]
  mortar: TailwindColor
  // The darkness the wall fades into at the top, also the color above the wall.
  ceiling: TailwindColor
}

export type Brick = { x: number; y: number; width: number; color: TailwindColor }

// Bricks are 3 rows tall with a row of mortar under each course, and 7 wide with a column
// of mortar after each, offset by half a brick on alternate courses.
export const BRICK_HEIGHT = 3
const COURSE = BRICK_HEIGHT + 1
const PITCH = 8

// The bricks of a wall `width` by `rows` cells, top course first.
export function wallBricks(seed: number, wall: Wall, width: number, rows: number): Brick[] {
  const bricks: Brick[] = []
  for (let course = 0; course * COURSE < rows; course++) {
    const offset = course % 2 === 0 ? 0 : PITCH / 2
    for (let x = -offset; x < width; x += PITCH) {
      const tone = hash(seed, x, course + 50) < 0.3 ? 1 : 0
      bricks.push({ x, y: course * COURSE, width: PITCH - 1, color: wall.bricks[tone] })
    }
  }
  return bricks
}
