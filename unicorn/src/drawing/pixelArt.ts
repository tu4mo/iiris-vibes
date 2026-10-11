import type { TailwindColor } from './colors'
import type { Pixel } from './types'

// Pixel art drawn as text: one line per row, top first, one character per cell, with '.'
// for an empty cell. Indents and blank lines are ignored. `colorOf` gives each
// character's color, and is told the cell (u counting rows up from the bottom) for
// colors that follow a pattern. Outlines are drawn in, like any other color.
export function pixelArt(
  text: string,
  colorOf: (char: string, x: number, u: number) => TailwindColor,
): { width: number; height: number; pixels: Pixel[] } {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
  const height = lines.length
  const pixels = lines.flatMap((line, y) =>
    [...line].flatMap((char, x) =>
      char === '.' ? [] : [{ x, y, color: colorOf(char, x, height - 1 - y) }],
    ),
  )
  return { width: Math.max(...lines.map((line) => line.length)), height, pixels }
}
