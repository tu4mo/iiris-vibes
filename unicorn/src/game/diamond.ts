import type { TailwindColor } from '../drawing/colors'
import { outlinedPixels, toShapes, type Shape } from './shape'

// Cut gems to collect in the cave. Coordinates while building the shape: x from the left
// edge, u = rows above the bottom point.

type DiamondStyle = { light: TailwindColor; mid: TailwindColor; dark: TailwindColor }

const DIAMOND_STYLES: DiamondStyle[] = [
  { light: 'cyan-100', mid: 'cyan-300', dark: 'cyan-500' },
  { light: 'pink-100', mid: 'pink-300', dark: 'pink-500' },
  { light: 'violet-100', mid: 'violet-300', dark: 'violet-500' },
  { light: 'emerald-100', mid: 'emerald-300', dark: 'emerald-500' },
  { light: 'amber-100', mid: 'amber-300', dark: 'amber-500' },
]

const CENTER = 4
// Half the width of each row, from the point at the bottom up to the flat top. The widest
// rows are the girdle, where the crown (above) meets the pavilion (below).
const HALF_WIDTHS = [0, 1, 2, 3, 4, 4, 3]
const GIRDLE = 4

function diamondColor(style: DiamondStyle, x: number, u: number): TailwindColor | null {
  const dx = x - CENTER
  if (Math.abs(dx) > HALF_WIDTHS[u]) return null
  // A glint on the top left of the crown.
  if (u === GIRDLE + 1 && dx === -2) return 'white'
  // The crown is lit from the left; the pavilion has a bright middle facet and a dark side.
  if (u > GIRDLE) return dx <= 0 ? style.light : style.mid
  if (dx === 0) return style.light
  return dx < 0 ? style.mid : style.dark
}

const { shapes } = toShapes(
  DIAMOND_STYLES.map((style) =>
    outlinedPixels(9, HALF_WIDTHS.length, (x, u) => diamondColor(style, x, u)),
  ),
)

// A diamond in each color, all the same size.
export const DIAMOND_SHAPES: Shape[] = shapes
