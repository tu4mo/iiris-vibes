import type { TailwindColor } from '../../drawing/colors'
import { pixelArt } from '../../drawing/pixelArt'
import type { Shape } from '../../drawing/types'

// Cut gems to collect in the cave.

type DiamondStyle = { light: TailwindColor; mid: TailwindColor; dark: TailwindColor }

const DIAMOND_STYLES: DiamondStyle[] = [
  { light: 'cyan-100', mid: 'cyan-300', dark: 'cyan-500' },
  { light: 'pink-100', mid: 'pink-300', dark: 'pink-500' },
  { light: 'violet-100', mid: 'violet-300', dark: 'violet-500' },
  { light: 'emerald-100', mid: 'emerald-300', dark: 'emerald-500' },
  { light: 'amber-100', mid: 'amber-300', dark: 'amber-500' },
]

// A flat top over the crown, which is lit from the left with a glint (W), and below the
// widest row the pavilion, with a bright middle facet and a dark right side. l, m and d
// are the style's light, mid and dark colors, and k the outline.
const DIAMOND = `
  ..kkkkkkk..
  .kllllmmmk.
  kllWllmmmmk
  kmmmmlddddk
  .kmmmldddk.
  ..kmmlddk..
  ...kmldk...
  ....klk....
`

// A diamond in each color, all the same size.
export const DIAMOND_SHAPES: Shape[] = DIAMOND_STYLES.map((style) => {
  const colors: Record<string, TailwindColor> = {
    k: 'indigo-950',
    W: 'white',
    l: style.light,
    m: style.mid,
    d: style.dark,
  }
  return pixelArt(DIAMOND, colors)
})
