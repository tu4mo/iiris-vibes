import type { TailwindColor } from '../../drawing/colors'
import { pixelArt } from '../../drawing/pixelArt'
import type { Shape } from '../../drawing/types'

// A tall arched window onto the night: a stone frame (F), a cross of leading (L), and
// stars (*) in a sky that darkens toward the top (v, m, n).
const COLORS: Record<string, TailwindColor> = {
  k: 'indigo-950',
  F: 'stone-400',
  L: 'stone-500',
  '*': 'amber-100',
  n: 'indigo-950',
  m: 'indigo-900',
  v: 'violet-900',
}

export const WINDOW: Shape = pixelArt(
  `
  .....kkkkk.....
  ...kkFFFFFkk...
  ..kFFnnLnnFFk..
  .kFFn*nLnnnFFk.
  .kFnnnnLnnnnFk.
  kFnnnnnLnn*nnFk
  kFnnnnnLnnnnnFk
  kFnnnnnLnnnnnFk
  kFn*nnnLnnnnnFk
  kFnnnnnLn*nnnFk
  kFmmmmmLmmmmmFk
  kFmmmmmLmmmmmFk
  kFmmmmmLmmm*mFk
  kFmmmmmLmmmmmFk
  kFmm*mmLmmmmmFk
  kFmmmmmLmmmmmFk
  kFmmmmmLm*mmmFk
  kFmmmmmLmmmmmFk
  kFLLLLLLLLLLLFk
  kFmmmmmLmmmmmFk
  kFmmm*mLmmmmmFk
  kFmmmmmLmmmmmFk
  kFvvvvvLvvvvvFk
  kFvvvvvLvvv*vFk
  kFvvvvvLvvvvvFk
  kFvvvvvLvvvvvFk
  kFv*vvvLvvvvvFk
  kFvvvvvLvvvvvFk
  kFvvvvvLv*vvvFk
  kFvvvvvLvvvvvFk
  kFFFFFFFFFFFFFk
  `,
  COLORS,
)
