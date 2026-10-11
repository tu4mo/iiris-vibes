import type { TailwindColor } from '../../drawing/colors'
import { cellKey } from '../../drawing/grid'
import type { Pixel } from '../../drawing/types'
import { outlinedPixels, toShapes, type Shape } from '../shape'

// A pixel-art snail facing left (toward the approaching unicorn), generated from simple
// shapes. Coordinates: x from the left edge, u = rows above the ground.

// How the two eye stalks (horns) are held in one animation frame: how far each one's tip
// leans sideways (negative is forward), and whether they're pulled in a little.
type Pose = { front: number; back: number; short: boolean }

// A slow wiggle: upright, both leaning forward, upright, only the front one leaning, then
// a twitch down (the squished snail is made from this last one). There's no leaning back:
// the back horn would merge into the shell.
const POSES: Pose[] = [
  { front: 0, back: 0, short: false },
  { front: -1, back: -1, short: false },
  { front: 0, back: 0, short: false },
  { front: -1, back: 0, short: false },
  { front: 0, back: 0, short: true },
]

function bodyColor(x: number, u: number, pose: Pose): TailwindColor | null {
  // Foot along the ground, with a head rising at the front.
  if (u <= 1 && x >= 1 && x <= 12) return u === 0 ? 'pink-300' : 'pink-200'
  if (u >= 2 && u <= 3 && x >= 1 && x <= 3) return 'pink-200'
  // Eye stalks topped with eyes: the base is fixed, the upper part leans.
  const tip = pose.short ? 5 : 6
  for (const [base, lean] of [
    [1, pose.front],
    [3, pose.back],
  ]) {
    if (u === 4 && x === base) return 'pink-300'
    if (u > 4 && u < tip && x === base + lean) return 'pink-300'
    if (u === tip && x === base + lean) return 'indigo-950'
  }
  return null
}

function shellColor(x: number, u: number): TailwindColor | null {
  const dx = x + 0.5 - 8.5
  const du = u + 0.5 - 4.5
  const distance = Math.hypot(dx, du)
  if (u < 1 || distance > 3.9) return null
  // Bands that wind outward with the angle, so the stripes read as a spiral.
  const turn = (Math.atan2(du, dx) + Math.PI) / (2 * Math.PI)
  return Math.floor(distance * 0.9 + turn * 1.8) % 2 === 0 ? 'pink-400' : 'fuchsia-600'
}

const { shapes: frames } = toShapes(
  POSES.map((pose) => outlinedPixels(14, 10, (x, u) => shellColor(x, u) ?? bodyColor(x, u, pose))),
)

// The snail in each horn pose, all the same size so they can be swapped.
export const SNAIL_FRAMES: Shape[] = frames
export const SNAIL_WIDTH = frames[0].width
export const SNAIL_HEIGHT = frames[0].height

// How much wider a squished snail is, on each side.
export const SQUISH_SPREAD = 1
const SQUISHED_HEIGHT = 5

// The snail flattened after being jumped on, horns pulled in: the last pose resampled to be
// shorter and a little wider. It starts SQUISH_SPREAD left of the snail.
export const SNAIL_SQUISHED: Shape = (() => {
  const source = SNAIL_FRAMES[SNAIL_FRAMES.length - 1]
  const colors = new Map(source.pixels.map((p) => [cellKey(p), p.color]))
  const width = SNAIL_WIDTH + 2 * SQUISH_SPREAD
  const pixels: Pixel[] = []
  for (let y = 0; y < SQUISHED_HEIGHT; y++) {
    for (let x = 0; x < width; x++) {
      // Sample from the middle of each source cell so the outline at the edges survives.
      const color = colors.get(
        cellKey({
          x: Math.floor(((x + 0.5) * SNAIL_WIDTH) / width),
          y: Math.floor(((y + 0.5) * SNAIL_HEIGHT) / SQUISHED_HEIGHT),
        }),
      )
      if (color) pixels.push({ x, y, color })
    }
  }
  return { width, height: SQUISHED_HEIGHT, pixels }
})()
