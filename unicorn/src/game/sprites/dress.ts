import type { TailwindColor } from '../../drawing/colors'
import type { Pixel } from '../../drawing/types'
import { pixelArt } from '../../drawing/pixelArt'
import type { Shape } from '../../drawing/types'
import {
  connectedGroups,
  mostCommon,
  outlineColor,
  recolor,
  UNICORN_LEG_ROWS,
  type Sprite,
} from './unicorn'

// Colorful dresses hanging on the castle walls. Jumping into one collects it, and the
// unicorn puts it on.

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

// A dress on its hanger: the hook and hanger (h), the bodice with puffed sleeves and the
// skirt (M, the main color), the sash and hem (T, the trim), the skirt's dots or stripes
// (A, the accent), and the outline (k).
const DOTS = `
  ........k......
  .......khk.....
  ......khkhk....
  ......khkk.....
  ......khk......
  .....khkhk.....
  ....khk.khk....
  ...khk...khk...
  ..khkkkkkkkhk..
  .khhhhhhhhhhhk.
  ..kkMMkkkMMkk..
  ..kMMMMMMMMMk..
  ...kMMMMMMMk...
  ....kMMMMMk....
  ....kTTTTTk....
  ...kMMMMMMMk...
  ...kMMAMMMAk...
  ...kMMMMMMMk...
  ..kMMMMMMMMMk..
  ..kMAMMMAMMMk..
  ..kMMMMMMMMMk..
  .kMMMMMMMMMMMk.
  .kAMMMAMMMAMMk.
  kTTTTTTTTTTTTTk
`

const STRIPES = `
  ........k......
  .......khk.....
  ......khkhk....
  ......khkk.....
  ......khk......
  .....khkhk.....
  ....khk.khk....
  ...khk...khk...
  ..khkkkkkkkhk..
  .khhhhhhhhhhhk.
  ..kkMMkkkMMkk..
  ..kMMMMMMMMMk..
  ...kMMMMMMMk...
  ....kMMMMMk....
  ....kTTTTTk....
  ...kMMMMMMMk...
  ...kAAAAAAAk...
  ...kMMMMMMMk...
  ..kMMMMMMMMMk..
  ..kAAAAAAAAAk..
  ..kMMMMMMMMMk..
  .kMMMMMMMMMMMk.
  .kAAAAAAAAAAAk.
  kTTTTTTTTTTTTTk
`

// Each style as a dress on its hanger, all the same size. A plain skirt is the striped
// one with no accent color.
export const DRESS_SHAPES: Shape[] = DRESS_STYLES.map((style) =>
  pixelArt(style.pattern === 'dots' ? DOTS : STRIPES, {
    k: 'indigo-950',
    h: 'slate-400',
    M: style.main,
    T: style.trim,
    A: style.pattern === 'plain' ? style.main : style.accent,
  }),
)
export const DRESS_WIDTH = DRESS_SHAPES[0].width

// The part of the unicorn a dress covers: the body just above the legs, down over the top
// of the legs like a skirt. It's the connected patch (not crossing the outline) with the
// most of the body's color in that band, so the mane and tail stay as they are.
function torso(sprite: Sprite): Pixel[] {
  // The legs are at the bottom of the sprite.
  const legTop = sprite.height - UNICORN_LEG_ROWS
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
  return recolor(
    sprite,
    covered.map(({ x, y }) => ({
      x,
      y,
      color: y === topOf.get(x) || y === bottomOf.get(x) ? style.trim : patternColor(style, x, y),
    })),
  )
}
