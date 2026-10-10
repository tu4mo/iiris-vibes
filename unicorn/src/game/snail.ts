import type { TailwindColor } from '../drawing/colors'

// A pixel-art snail facing left (toward the approaching unicorn), generated from simple
// shapes. Coordinates: x from the left edge, u = rows above the ground.

// How the two eye stalks (horns) are held in one animation frame: how far each one's tip
// leans sideways (negative is forward), and whether they're pulled in a little.
type Pose = { front: number; back: number; short: boolean }

// A slow wiggle: upright, both leaning forward, upright, only the front one leaning, then
// a twitch down (the squished snail is made from this last one). Leaning back would merge the back horn into the shell.
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

// Every snail pixel in one pose, keyed "x,u", with an indigo outline around the whole shape.
function generateSnail(pose: Pose): Map<string, TailwindColor> {
  const pixels = new Map<string, TailwindColor>()
  for (let u = 0; u < 10; u++) {
    for (let x = -1; x < 14; x++) {
      const color = shellColor(x, u) ?? bodyColor(x, u, pose)
      if (color) pixels.set(`${x},${u}`, color)
    }
  }
  const outline: string[] = []
  for (let u = 0; u <= 10; u++) {
    for (let x = -1; x <= 14; x++) {
      if (pixels.has(`${x},${u}`)) continue
      const touches = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ].some(([dx, du]) => pixels.has(`${x + dx},${u + du}`))
      if (touches) outline.push(`${x},${u}`)
    }
  }
  for (const key of outline) pixels.set(key, 'indigo-950')
  return pixels
}

const frames = POSES.map(generateSnail)
const coords = (key: string) => key.split(',').map(Number)
const allKeys = [...new Set(frames.flatMap((f) => [...f.keys()]))]
// Shift every pose by the same amount, so the leftmost pixel of any pose is at x = 0.
const minX = Math.min(...allKeys.map((k) => coords(k)[0]))

// Every pixel of the snail in each horn pose, keyed "x,u".
export const SNAIL_FRAMES: Map<string, TailwindColor>[] = frames.map(
  (frame) =>
    new Map(
      [...frame].map(([key, color]) => {
        const [x, u] = coords(key)
        return [`${x - minX},${u}`, color]
      }),
    ),
)

const shifted = allKeys.map((k) => coords(k))
export const SNAIL_WIDTH = Math.max(...shifted.map(([x]) => x)) - minX + 1
export const SNAIL_HEIGHT = Math.max(...shifted.map(([, u]) => u)) + 1

// How much wider a squished snail is, on each side.
export const SQUISH_SPREAD = 1
const SQUISHED_HEIGHT = 5

// The snail flattened after being jumped on, horns pulled in: the last pose resampled to be
// shorter and a little wider. Keys start at x = 0, SQUISH_SPREAD left of the snail.
export const SNAIL_SQUISHED: Map<string, TailwindColor> = (() => {
  const source = SNAIL_FRAMES[SNAIL_FRAMES.length - 1]
  const width = SNAIL_WIDTH + 2 * SQUISH_SPREAD
  const squished = new Map<string, TailwindColor>()
  for (let u = 0; u < SQUISHED_HEIGHT; u++) {
    for (let x = 0; x < width; x++) {
      // Sample from the middle of each source cell so the outline at the edges survives.
      const sx = Math.floor(((x + 0.5) * SNAIL_WIDTH) / width)
      const su = Math.floor(((u + 0.5) * SNAIL_HEIGHT) / SQUISHED_HEIGHT)
      const color = source.get(`${sx},${su}`)
      if (color) squished.set(`${x},${u}`, color)
    }
  }
  return squished
})()
