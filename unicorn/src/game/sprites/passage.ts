import type { TailwindColor } from '../../drawing/colors'
import { pixelArt } from '../../drawing/pixelArt'
import type { Shape } from '../shape'

// The secret passage: a pitch-black arch (b) with loose dark stones (s) around its edge.
const PASSAGE_COLORS: Record<string, TailwindColor> = {
  k: 'indigo-950',
  b: 'black',
  s: 'stone-600',
}

export const PASSAGE: Shape = pixelArt(
  `
  ............kkkkkkkk............
  .........kkksbbbbsbbkkk.........
  ........kbbbsssbbbsbsbbk........
  ......kkbsbsbbbbbbbbbssbkk......
  .....kbsssbbbbbbbbbbbbbbbsk.....
  ....ksbsbbbbbbbbbbbbbbbbsbbk....
  ...kbsbbbbbbbbbbbbbbbbbbbsbsk...
  ...kbbbbbbbbbbbbbbbbbbbbbbssk...
  ..kbbbbbbbbbbbbbbbbbbbbbbbbbsk..
  .kbssbbbbbbbbbbbbbbbbbbbbbbssbk.
  .kbbbbbbbbbbbbbbbbbbbbbbbbbbssk.
  .kbsbbbbbbbbbbbbbbbbbbbbbbbbssk.
  kssbbbbbbbbbbbbbbbbbbbbbbbbbbssk
  kssbbbbbbbbbbbbbbbbbbbbbbbbbbbsk
  kssbbbbbbbbbbbbbbbbbbbbbbbbbbssk
  kbbbbbbbbbbbbbbbbbbbbbbbbbbbbbsk
  kbsbbbbbbbbbbbbbbbbbbbbbbbbbbsbk
  kbbbbbbbbbbbbbbbbbbbbbbbbbbbbbsk
  kssbbbbbbbbbbbbbbbbbbbbbbbbbbssk
  kbbbbbbbbbbbbbbbbbbbbbbbbbbbbssk
  kbsbbbbbbbbbbbbbbbbbbbbbbbbbbbsk
  kbsbbbbbbbbbbbbbbbbbbbbbbbbbbbbk
  kbbbbbbbbbbbbbbbbbbbbbbbbbbbbsbk
  kbsbbbbbbbbbbbbbbbbbbbbbbbbbbssk
  kbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbk
  kssbbbbbbbbbbbbbbbbbbbbbbbbbbsbk
  kbbbbbbbbbbbbbbbbbbbbbbbbbbbbsbk
  ksbbbbbbbbbbbbbbbbbbbbbbbbbbbbbk
  kbsbbbbbbbbbbbbbbbbbbbbbbbbbbsbk
  kbbbbbbbbbbbbbbbbbbbbbbbbbbbbsbk
  ksbbbbbbbbbbbbbbbbbbbbbbbbbbbbbk
  kssbbbbbbbbbbbbbbbbbbbbbbbbbbssk
  kssbbbbbbbbbbbbbbbbbbbbbbbbbbsbk
  kbbbbbbbbbbbbbbbbbbbbbbbbbbbbssk
  kbbbbbbbbbbbbbbbbbbbbbbbbbbbbbsk
  kssbbbbbbbbbbbbbbbbbbbbbbbbbbsbk
  kbsbbbbbbbbbbbbbbbbbbbbbbbbbbssk
  kbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbk
  kssbbbbbbbbbbbbbbbbbbbbbbbbbbssk
  kssbbbbbbbbbbbbbbbbbbbbbbbbbbbsk
  kbbbbbbbbbbbbbbbbbbbbbbbbbbbbbsk
  kbsbbbbbbbbbbbbbbbbbbbbbbbbbbsbk
  ksbbbbbbbbbbbbbbbbbbbbbbbbbbbbbk
  kssbbbbbbbbbbbbbbbbbbbbbbbbbbssk
  kbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbk
  `,
  (char) => PASSAGE_COLORS[char],
)
