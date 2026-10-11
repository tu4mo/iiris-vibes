import type { Pixel } from '../../drawing/types'
import type { Field } from '../field'
import type { Sky } from '../sky'
import type { Wall } from '../wall'

// Open air: a sky that doesn't move, and scenery that scrolls slower than the field.
export type Outdoors = {
  kind: 'outdoors'
  // The sky at the start, and the one it fades into on the way to the exit, if it changes.
  sky: Sky
  skyAtExit?: Sky
  // How dark the land gets by the exit: the opacity of an indigo shade over it, 0 to 1.
  shadeAtExit?: number
  // Scenery behind the field, `width` columns wide, scrolled for parallax.
  backdrop?: (seed: number, width: number, rows: number) => Pixel[]
}

// Inside: a wall right behind the field, scrolling with it.
export type Indoors = { kind: 'indoors'; wall: Wall }

// One scene of the game. The unicorn starts at the left and walks right to the field's
// exit; reaching it moves on to the next level in LEVELS, or ends the game after the last.
export type Level = {
  // Size of the field in cells.
  width: number
  rows: number
  // Builds the field. Called once per play of the level, with a fresh random seed.
  generate: (seed: number) => Field
  // What's behind the field.
  scenery: Outdoors | Indoors
  // How to play, shown at the bottom of the screen.
  hint: string
}
