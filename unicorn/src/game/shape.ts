import type { TailwindColor } from '../drawing/colors'
import { cellKey } from '../drawing/grid'
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

// A pixel while a shape is being built: u counts rows up from the ground, which is how
// the castle and snail are described.
export type GroundPixel = { x: number; u: number; color: TailwindColor }

// Every cell of the box x in [0, width), u in [0, height) that `colorAt` colors, plus an
// indigo outline around the whole shape (which can reach one cell outside the box).
export function outlinedPixels(
  width: number,
  height: number,
  colorAt: (x: number, u: number) => TailwindColor | null,
): GroundPixel[] {
  const filled = new Set<string>()
  const pixels: GroundPixel[] = []
  for (let u = 0; u < height; u++) {
    for (let x = 0; x < width; x++) {
      const color = colorAt(x, u)
      if (!color) continue
      pixels.push({ x, u, color })
      filled.add(cellKey({ x, y: u }))
    }
  }
  // Collect the outline first, so outline cells don't count as part of the shape.
  const outline: GroundPixel[] = []
  for (let u = 0; u <= height; u++) {
    for (let x = -1; x <= width; x++) {
      if (filled.has(cellKey({ x, y: u }))) continue
      if (SIDES.some(([dx, du]) => filled.has(cellKey({ x: x + dx, y: u + du })))) {
        outline.push({ x, u, color: 'indigo-950' })
      }
    }
  }
  return [...pixels, ...outline]
}

// Turns frames of the same thing into shapes, cropped to one shared box so the frames line
// up when swapped. `left` is how far the box starts left of x = 0 in the frames' coordinates.
export function toShapes(frames: GroundPixel[][]): { shapes: Shape[]; left: number } {
  const all = frames.flat()
  const left = Math.min(...all.map((p) => p.x))
  const top = Math.max(...all.map((p) => p.u))
  const width = Math.max(...all.map((p) => p.x)) - left + 1
  const shapes = frames.map((frame) => ({
    width,
    height: top + 1,
    pixels: frame.map((p) => ({ x: p.x - left, y: top - p.u, color: p.color })),
  }))
  return { shapes, left }
}
