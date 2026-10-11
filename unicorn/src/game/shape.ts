import type { Pixel } from '../drawing/types'

// A pixel-art shape. Pixels count from the top-left corner, with y going down, and the
// bottom row (y = height - 1) is the one that rests on the ground.
export type Shape = { width: number; height: number; pixels: Pixel[] }

// The four edge neighbours of a cell.
export const SIDES = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const
