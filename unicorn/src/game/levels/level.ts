import type { Pixel } from '../../drawing/types'
import type { Field } from '../field'
import type { Sky } from '../sky'

// One scene of the game. The unicorn starts at the left and walks right to the field's
// exit; reaching it finishes the level and moves on to the next one in LEVELS.
export type Level = {
  // Size of the field in cells.
  width: number
  rows: number
  // Builds the field. Called once per play of the level, with a fresh random seed.
  generate: (seed: number) => Field
  // Scenery behind the field, `width` columns wide. It scrolls slower than the field for
  // parallax. Without one, only the sky shows behind the field.
  backdrop?: (seed: number, width: number, rows: number) => Pixel[]
  // The sky at the start, and the one it fades into on the way to the exit, if it changes.
  sky: Sky
  skyAtExit?: Sky
  // How dark the land gets by the exit: the opacity of an indigo shade over it, 0 to 1.
  shadeAtExit?: number
  // How to play, shown at the bottom of the screen.
  hint: string
  // Shown when the unicorn reaches the exit.
  exitTitle: string
}
