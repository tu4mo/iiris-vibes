import type { TailwindColor } from '../drawing/colors'
import { cellKey } from '../drawing/grid'
import type { Pixel } from '../drawing/types'
import { outlinedPixels, toShapes, type Shape } from './shape'
import { connectedGroups, findLegs, mostCommon, outlineColor, type Sprite } from './sprite'

// Colorful dresses hanging on the castle walls. Jumping into one collects it, and the
// unicorn puts it on. Coordinates while building the shape: x from the left edge,
// u = rows above the hem.

export type DressStyle = {
  main: TailwindColor
  // The hem, the sash and, when worn, the collar.
  trim: TailwindColor
  // The dots or stripes on the skirt.
  accent: TailwindColor
  pattern: 'dots' | 'stripes' | 'plain'
}

export const DRESS_STYLES: DressStyle[] = [
  { main: 'red-400', trim: 'amber-200', accent: 'white', pattern: 'dots' },
  { main: 'sky-400', trim: 'white', accent: 'sky-200', pattern: 'stripes' },
  { main: 'amber-300', trim: 'orange-500', accent: 'white', pattern: 'dots' },
  { main: 'violet-500', trim: 'fuchsia-300', accent: 'violet-300', pattern: 'stripes' },
  { main: 'emerald-400', trim: 'lime-200', accent: 'white', pattern: 'dots' },
  { main: 'fuchsia-500', trim: 'amber-300', accent: 'pink-300', pattern: 'plain' },
]

// The skirt's pattern at a cell. Rows can count up or down; only their spacing matters.
function patternColor(style: DressStyle, x: number, row: number): TailwindColor {
  const r = Math.abs(row)
  if (style.pattern === 'dots' && r % 3 === 1 && (x + Math.floor(r / 3) * 2) % 4 === 1) {
    return style.accent
  }
  if (style.pattern === 'stripes' && r % 3 === 1) return style.accent
  return style.main
}

const CENTER = 6
const WAIST = 9
const SHOULDER = 13
// The hanger's bar rests on the shoulders; its apex and hook are above.
const HANGER = 14

function dressColor(style: DressStyle, x: number, u: number): TailwindColor | null {
  const dx = Math.abs(x - CENTER)
  // A skirt flaring out from the waist to the hem.
  if (u < WAIST) {
    const half = 3 + ((WAIST - 1 - u) / (WAIST - 1)) * 3
    if (dx > half) return null
    return u === 0 ? style.trim : patternColor(style, x, u)
  }
  if (u === WAIST) return dx <= 2 ? style.trim : null
  // The bodice with a scooped neckline, and puffed sleeves with rounded corners.
  if (u <= SHOULDER) {
    if (dx <= 2) return u === SHOULDER && dx <= 1 ? null : style.main
    const corner = (u === WAIST + 2 || u === SHOULDER) && dx === 4
    if (u > WAIST + 1 && dx <= 4 && !corner) return style.main
    return null
  }
  // The hanger: a bar, two sides rising to a point, and a hook on top.
  const hanger: TailwindColor = 'slate-400'
  if (u === HANGER) return dx <= 5 ? hanger : null
  if (u <= HANGER + 5) return dx === HANGER + 5 - u ? hanger : null
  const hook = [
    [CENTER, HANGER + 6],
    [CENTER, HANGER + 7],
    [CENTER + 1, HANGER + 8],
    [CENTER + 2, HANGER + 7],
  ]
  return hook.some(([hx, hu]) => hx === x && hu === u) ? hanger : null
}

const { shapes } = toShapes(
  DRESS_STYLES.map((style) => outlinedPixels(13, HANGER + 9, (x, u) => dressColor(style, x, u))),
)

// Each style as a dress on its hanger, all the same size.
export const DRESS_SHAPES: Shape[] = shapes
export const DRESS_WIDTH = shapes[0].width
export const DRESS_HEIGHT = shapes[0].height

// How high a dress's hem hangs, in cells from the bottom. Dresses hang `lift` cells above
// the unicorn's head, so it has to jump to reach them however tall it's drawn.
export function dressBottom(dress: { ground: number; lift: number }, spriteHeight: number) {
  return dress.ground + spriteHeight + dress.lift
}

// The part of the unicorn a dress covers: the body just above the legs, down over the top
// of the legs like a skirt. It's the connected patch (not crossing the outline) with the
// most of the body's color in that band, so the mane and tail stay as they are.
function torso(sprite: Sprite): Pixel[] {
  const legs = findLegs(sprite)
  const legTop =
    legs.length > 0 ? Math.min(...legs.flat().map((p) => p.y)) : Math.round(sprite.height * 0.8)
  const top = legTop - Math.round(sprite.height * 0.22)
  const outline = outlineColor(sprite)
  const band = sprite.pixels.filter((p) => p.y >= top && p.y <= legTop + 1 && p.color !== outline)
  const body = mostCommon(band.map((p) => p.color))
  const bodyCount = (group: Pixel[]) => group.filter((p) => p.color === body).length
  return connectedGroups(band).sort((a, b) => bodyCount(b) - bodyCount(a))[0] ?? []
}

// The unicorn wearing a dress: the torso recolored in the dress's colors, with trim along
// its top (the collar) and bottom (the hem).
export function wearDress(sprite: Sprite, style: DressStyle): Sprite {
  const covered = torso(sprite)
  if (covered.length === 0) return sprite
  const topOf = new Map<number, number>()
  const bottomOf = new Map<number, number>()
  for (const { x, y } of covered) {
    topOf.set(x, Math.min(topOf.get(x) ?? y, y))
    bottomOf.set(x, Math.max(bottomOf.get(x) ?? y, y))
  }
  const colors = new Map(
    covered.map(({ x, y }) => [
      cellKey({ x, y }),
      y === topOf.get(x) || y === bottomOf.get(x) ? style.trim : patternColor(style, x, y),
    ]),
  )
  return {
    ...sprite,
    pixels: sprite.pixels.map((p) => {
      const color = colors.get(cellKey(p))
      return color ? { ...p, color } : p
    }),
  }
}
