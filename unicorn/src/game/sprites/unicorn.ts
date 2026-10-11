import type { TailwindColor } from '../../drawing/colors'
import { cellKey, type Cell } from '../../drawing/grid'
import { compositePixels } from '../../drawing/layers'
import { pixelArt } from '../../drawing/pixelArt'
import type { Drawing, Pixel, Shape } from '../../drawing/types'

// The unicorn in the game: a shape cropped from the drawing.
export type Sprite = Shape

// The built-in unicorn, sampled 1:1 from the reference image, with each color snapped to
// the nearest Tailwind palette color. It's drawn in layers, so the hair can be restyled
// on its own and the eye can blink; all are drawn in the same frame, so they line up.
// The editor starts from these (see presets/defaultDrawing.ts).
const COLORS: Record<string, TailwindColor> = {
  k: 'indigo-950',
  W: 'white',
  b: 'sky-200',
  B: 'sky-300',
  g: 'slate-400',
  a: 'amber-500',
  r: 'rose-400',
  P: 'pink-600',
  o: 'orange-300',
  G: 'green-300',
  t: 'teal-500',
  C: 'cyan-600',
  v: 'violet-400',
  p: 'purple-800',
}

// The outline, horn and the white body with its shading. The eye and the legs are drawn
// separately.
const BODY = `
  ........................kkk.
  .......................kaWk.
  ..................kkk.kaWkk.
  ..............kkkk...kaWak..
  .............k.kbbk..aWak...
  ............kk.kWbk..aaak...
  ...........k...kWkWk..kkk...
  ..........k....kWkWk.....kk.
  ..........k....kkWWbk......k
  ..........k....kbWWWWWkkkkk.
  .........k.....kbWWWWWWWWk..
  .........k.....kbWWWWWWWWk..
  ........k......kbWWWWWWWWWk.
  ........k......kbWWWWWWWWWWk
  .........k.....kgbWWWWWWWWWk
  .........kk....kggbWWWWkWkbk
  .....kkkk......kbbggbbbbbbbk
  ....k...k......kWbBBgggggggk
  ...kk...kk.....kWWWBkkkkkkk.
  ..k......kkkkkkWWWWWbgk.....
  ..k.....kWWWWWWWWWWWbgk.....
  ..k....kbWWWWWWWWWWWbgk.....
  .k.....kbWWWWWWWWWWWbgk.....
  k.....kkbWWWbbbbbWWWggk.....
  k.....kkbWWbbbbbbbWWggk.....
  .k...k.kbWBggggggbWWggk.....
  ..kkk..kbWgkkkkkkbWWkgk.....
`

// The mane, forelock and tail, in the rainbow hair style's colors (see presets/hairStyles.ts).
const HAIR = `
  ............................
  ............................
  ............................
  ..................rrr.......
  ..............P....ro.......
  ..............P....ro.......
  ............PPa.....ro......
  ...........PPPa.....rrooo...
  ...........oooa......rrrrrr.
  ...........ooaa.............
  ..........oooat.............
  ..........oaaat.............
  .........GGGGGt.............
  .........GGGGBt.............
  ..........BBBBt.............
  ...........Bvvp.............
  .........vvvvvp.............
  .....PPP.pvvvvp.............
  .....PrP..ppppp.............
  ...PPrPPP...................
  ...ooaPP....................
  ...ooat.....................
  ..oooCC.....................
  .GGGCC......................
  .GGGCC......................
  ..CCC.......................
  ............................
  ............................
  ............................
  ............................
  ............................
`

// The eye, open and closed mid-blink (the skin with a lid line along the bottom). Blinking
// switches one for the other. Both are drawn over the body at UNICORN_EYE in its frame.
export const UNICORN_EYE = { x: 19, y: 10 }
const EYE_OPEN = `
  kkk
  kWk
  kkk
  kkk
`
const EYE_CLOSED = `
  WWW
  WWW
  WWW
  kkk
`

// The legs in each pose, drawn below the body at UNICORN_LEGS in its frame. Standing,
// the walk cycle (the back and front legs take turns lifting and swinging forward), and
// leaping. Some hooves are on the bottom row in every pose: the unicorn stands on them.
export const UNICORN_LEGS = { x: 0, y: 27 }
const LEGS_STANDING = `
  .......kgbgkggk..kbWkgk.....
  .......kgggkggk..kbWkk......
  .......krrk.kk...krrk.......
  ........kk........kk........
`
const LEGS_WALK = [
  `
  .......kgbgkggk..kbWkgk.....
  ........kgggkggkkbWkk.......
  ........krrk.kk.krrk........
  .........kk......kk.........
`,
  `
  .......kgbgkggk..kbWkk......
  .......kgggkggk..krrk.......
  .......krrk.kk....kk........
  ........kk..................
`,
  `
  .......kgbgkggk..kbWkgk.....
  ......kgggkggk....kbWkk.....
  ......krrk.kk.....krrk......
  .......kk..........kk.......
`,
  `
  .......kgggkggk..kbWkgk.....
  .......krrk.kk...kbWkk......
  ........kk.......krrk.......
  ..................kk........
`,
]
const LEGS_LEAP = LEGS_WALK[2]

// What the unicorn is doing: standing, leaping, or which step of the walk cycle it's on.
export type Pose = 'standing' | 'leaping' | number
export const WALK_STEPS = LEGS_WALK.map((_, i) => i)

export const UNICORN_BODY: Shape = pixelArt(BODY, COLORS)
export const UNICORN_HAIR: Shape = pixelArt(HAIR, COLORS)
export const UNICORN_EYE_OPEN: Shape = pixelArt(EYE_OPEN, COLORS)
export const UNICORN_EYE_CLOSED: Shape = pixelArt(EYE_CLOSED, COLORS)
const LEG_SHAPES = {
  standing: pixelArt(LEGS_STANDING, COLORS),
  leaping: pixelArt(LEGS_LEAP, COLORS),
  steps: LEGS_WALK.map((legs) => pixelArt(legs, COLORS)),
}
export const unicornLegs = (pose: Pose): Shape =>
  typeof pose === 'number' ? LEG_SHAPES.steps[pose] : LEG_SHAPES[pose]
// How many rows the legs take up at the bottom of the unicorn.
export const UNICORN_LEG_ROWS = LEG_SHAPES.standing.height

// The sprite in each pose: walking and leaping.
export type Gait = { steps: Sprite[]; leap: Sprite }

// The sprite in a pose, given its gait.
export function posed(sprite: Sprite, { steps, leap }: Gait, pose: Pose): Sprite {
  return pose === 'standing' ? sprite : pose === 'leaping' ? leap : steps[pose]
}

// The designed unicorn as a sprite: every visible layer, cropped tight.
export function spriteFromDrawing(drawing: Drawing): Sprite {
  const pixels = [...compositePixels(drawing).values()]
  if (pixels.length === 0) return { width: 0, height: 0, pixels: [] }
  const minX = Math.min(...pixels.map((p) => p.x))
  const minY = Math.min(...pixels.map((p) => p.y))
  return {
    width: Math.max(...pixels.map((p) => p.x)) - minX + 1,
    height: Math.max(...pixels.map((p) => p.y)) - minY + 1,
    pixels: pixels.map((p) => ({ x: p.x - minX, y: p.y - minY, color: p.color })),
  }
}

// The four edge neighbours of a cell.
export const SIDES = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const

// The cell next to `cell` in direction [dx, dy].
const step = (cell: Cell, [dx, dy]: readonly [number, number]) => ({
  x: cell.x + dx,
  y: cell.y + dy,
})

// Groups of pixels connected edge to edge.
export function connectedGroups(pixels: Pixel[]): Pixel[][] {
  const byKey = new Map(pixels.map((p) => [cellKey(p), p]))
  const seen = new Set<string>()
  const groups: Pixel[][] = []
  for (const start of pixels) {
    if (seen.has(cellKey(start))) continue
    const group: Pixel[] = []
    const stack = [start]
    seen.add(cellKey(start))
    while (stack.length > 0) {
      const p = stack.pop()!
      group.push(p)
      for (const side of SIDES) {
        const key = cellKey(step(p, side))
        const next = byKey.get(key)
        if (next && !seen.has(key)) {
          seen.add(key)
          stack.push(next)
        }
      }
    }
    groups.push(group)
  }
  return groups
}

export function mostCommon<T>(items: T[]): T | undefined {
  const counts = new Map<T, number>()
  for (const item of items) counts.set(item, (counts.get(item) ?? 0) + 1)
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0]
}

// Whether a pixel is on the sprite's edge: next to an empty cell that can be reached from
// outside the sprite.
function edgeTest(sprite: Sprite): (p: Pixel) => boolean {
  const byKey = new Map(sprite.pixels.map((p) => [cellKey(p), p]))
  const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < sprite.width && y < sprite.height

  // Empty cells reachable from outside the sprite.
  const exterior = new Set<string>()
  const stack: [number, number][] = []
  for (let x = -1; x <= sprite.width; x++) stack.push([x, -1], [x, sprite.height])
  for (let y = 0; y < sprite.height; y++) stack.push([-1, y], [sprite.width, y])
  while (stack.length > 0) {
    const [x, y] = stack.pop()!
    const key = cellKey({ x, y })
    if (exterior.has(key) || byKey.has(key)) continue
    if (x < -1 || y < -1 || x > sprite.width || y > sprite.height) continue
    exterior.add(key)
    for (const [dx, dy] of SIDES) stack.push([x + dx, y + dy])
  }
  return (p) =>
    SIDES.some((side) => {
      const n = step(p, side)
      return exterior.has(cellKey(n)) || !inside(n.x, n.y)
    })
}

// The outline's color: the most common color around the sprite's edge.
export function outlineColor(sprite: Sprite) {
  return mostCommon(sprite.pixels.filter(edgeTest(sprite)).map((p) => p.color))
}

// The sprite with some of its pixels painted over in new colors. Cells it doesn't already
// have are left out.
export function recolor(sprite: Sprite, paint: Pixel[]): Sprite {
  const colors = new Map(paint.map((p) => [cellKey(p), p.color]))
  return {
    ...sprite,
    pixels: sprite.pixels.map((p) => {
      const color = colors.get(cellKey(p))
      return color ? { ...p, color } : p
    }),
  }
}
