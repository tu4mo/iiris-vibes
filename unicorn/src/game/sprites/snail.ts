import type { TailwindColor } from '../../drawing/colors'
import { pixelArt } from '../../drawing/pixelArt'
import type { Shape } from '../../drawing/types'

// A pixel-art snail facing left (toward the approaching unicorn): a foot along the
// ground (f) with a head rising at the front (b), two eye stalks topped with eyes, and a
// spiral shell in two pinks (s and S), outlined in k. Each pose only moves the horns, and
// all are the same size so they can be swapped.

const COLORS: Record<string, TailwindColor> = {
  k: 'indigo-950',
  b: 'pink-200',
  f: 'pink-300',
  s: 'pink-400',
  S: 'fuchsia-600',
}

const UPRIGHT = pixelArt(
  `
  .......kkkkk...
  ..k.k.ksssssk..
  .kkkkkssSSSSsk.
  .kfkfksSsssSSk.
  .kfkfksSssSsSk.
  .kbbbkssSSSsSk.
  .kbbbkSssssSSk.
  .kbbbbbSSSSSbbk
  .kffffffffffffk
`,
  COLORS,
)

// Both horns leaning forward.
const LEANING = pixelArt(
  `
  .......kkkkk...
  .k.k..ksssssk..
  kkkkkkssSSSSsk.
  kfkfkksSsssSSk.
  .kfkfksSssSsSk.
  .kbbbkssSSSsSk.
  .kbbbkSssssSSk.
  .kbbbbbSSSSSbbk
  .kffffffffffffk
`,
  COLORS,
)

// Only the front horn leaning forward.
const FRONT_LEANING = pixelArt(
  `
  .......kkkkk...
  .k..k.ksssssk..
  kkkkkkssSSSSsk.
  kfkkfksSsssSSk.
  .kfkfksSssSsSk.
  .kbbbkssSSSsSk.
  .kbbbkSssssSSk.
  .kbbbbbSSSSSbbk
  .kffffffffffffk
`,
  COLORS,
)

// Both horns pulled in a little.
const PULLED_IN = pixelArt(
  `
  .......kkkkk...
  ......ksssssk..
  ..k.kkssSSSSsk.
  .kkkkksSsssSSk.
  .kfkfksSssSsSk.
  .kbbbkssSSSsSk.
  .kbbbkSssssSSk.
  .kbbbbbSSSSSbbk
  .kffffffffffffk
`,
  COLORS,
)

// The horns' slow wiggle, a pose per frame: upright, both leaning forward, upright, only
// the front one leaning, then a twitch down (the squished snail is made from this last
// one). There's no leaning back: the back horn would merge into the shell.
export const SNAIL_FRAMES: Shape[] = [UPRIGHT, LEANING, UPRIGHT, FRONT_LEANING, PULLED_IN]
export const SNAIL_WIDTH = UPRIGHT.width
export const SNAIL_HEIGHT = UPRIGHT.height

// The snail flattened for a moment after being jumped on, horns pulled in. It's a cell
// wider on each side, so it's drawn SQUISH_SPREAD left of the snail.
export const SQUISH_SPREAD = 1
export const SNAIL_SQUISHED = pixelArt(
  `
  ........kkkkkk...
  ..k..kkssSSSSSsk.
  .kfkkfksSssSssSk.
  .kbbbbkSssssSSSk.
  .kffffffffffffffk
`,
  COLORS,
)
