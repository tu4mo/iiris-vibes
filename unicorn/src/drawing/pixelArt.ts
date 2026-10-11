import type { TailwindColor } from './colors'
import type { Shape } from './types'

// Pixel art drawn as text: one line per row, top first, one character per cell, with '.'
// for an empty cell. Indents and blank lines are ignored. `colors` gives each character's
// color; outlines are drawn in, like any other color.
export function pixelArt(text: string, colors: Record<string, TailwindColor>): Shape {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
  const pixels = lines.flatMap((line, y) =>
    [...line].flatMap((char, x) => {
      if (char === '.') return []
      const color = colors[char]
      if (!color) throw new Error(`No color for '${char}' in pixel art`)
      return [{ x, y, color }]
    }),
  )
  return { width: Math.max(...lines.map((line) => line.length)), height: lines.length, pixels }
}
