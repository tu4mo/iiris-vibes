import type { TailwindColor } from '../../drawing/colors'
import { pixelArt } from '../../drawing/pixelArt'
import type { Shape } from '../../drawing/types'

// A torch in an iron bracket.
const COLORS: Record<string, TailwindColor> = {
  k: 'indigo-950',
  r: 'red-500',
  Y: 'amber-300',
  O: 'orange-500',
  y: 'amber-200',
  o: 'orange-400',
  s: 'slate-500',
  w: 'amber-800',
  S: 'slate-600',
}

export const TORCH: Shape = pixelArt(
  `
  ..k..
  .krk.
  kOYOk
  koyok
  koyok
  ksssk
  .kwk.
  .kwk.
  .kwk.
  kSSSk
  kSSSk
  `,
  COLORS,
)
