export const TAILWIND_HUES = [
  'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal',
  'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink',
  'rose', 'slate', 'gray', 'zinc', 'neutral', 'stone',
] as const

export const TAILWIND_SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const

type TailwindHue = (typeof TAILWIND_HUES)[number]
type TailwindShade = (typeof TAILWIND_SHADES)[number]

// A Tailwind palette color name, e.g. 'sky-300'; rendered via var(--color-<name>).
export type TailwindColor = `${TailwindHue}-${TailwindShade}` | 'white' | 'black'

export function cssColor(color: TailwindColor) {
  return `var(--color-${color})`
}

// Hard-edged stripes, one per color, so gradients read as pixel art.
export function hardStripes(direction: string, colors: TailwindColor[]) {
  const stops = colors.map((color, i) => {
    const from = (i / colors.length) * 100
    const to = ((i + 1) / colors.length) * 100
    return `${cssColor(color)} ${from}% ${to}%`
  })
  return `linear-gradient(${direction}, ${stops.join(', ')})`
}
