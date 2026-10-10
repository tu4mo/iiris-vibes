import { TAILWIND_HUES, TAILWIND_SHADES, cssColor, type TailwindColor } from '../../drawing/colors'
import { maneEdgeStyle } from '../mane'

const rows: TailwindColor[][] = [
  ...TAILWIND_HUES.map((hue) => TAILWIND_SHADES.map((shade) => `${hue}-${shade}` as const)),
  ['white', 'black'],
]

type ColorPaletteProps = {
  value: TailwindColor
  onChange: (color: TailwindColor) => void
}

// The full Tailwind palette as a second column next to the toolbar, with the same rainbow
// edge separating it from the canvas.
export function ColorPalette({ value, onChange }: ColorPaletteProps) {
  return (
    <aside
      aria-label="Colors"
      className="min-h-0 shrink-0 overflow-y-auto border-r-4 bg-indigo-950 p-2.5"
      style={maneEdgeStyle}
    >
      <div className="flex flex-col gap-0.5">
        {rows.map((row) => (
          <div key={row[0]} className="flex gap-0.5">
            {row.map((color) => (
              <button
                key={color}
                type="button"
                title={color}
                aria-label={color}
                aria-pressed={color === value}
                className="size-5 rounded-sm ring-1 ring-white/10 ring-inset hover:scale-125 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-amber-300 aria-pressed:outline-2 aria-pressed:outline-offset-1 aria-pressed:outline-white"
                style={{ backgroundColor: cssColor(color) }}
                onClick={() => onChange(color)}
              />
            ))}
          </div>
        ))}
      </div>
    </aside>
  )
}
