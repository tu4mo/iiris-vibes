import { memo, useMemo } from 'react'
import { cssColor, type TailwindColor } from '../../drawing/colors'
import { cellKey } from '../../drawing/grid'
import type { Pixel } from '../../drawing/types'
import { SNAIL_FRAMES, SNAIL_SQUISHED, SQUISH_SPREAD } from '../../game/snail'
import type { Shape } from '../../game/shape'
import type { Sprite } from '../../game/sprite'
import { skyBands, type Field } from '../../game/world'
import { PixelRects } from '../PixelArt'

// Pixels as absolutely positioned divs, `cell` px each, inside a positioned parent.
function PixelDivs({ pixels, cell }: { pixels: Pixel[]; cell: number }) {
  return pixels.map((p) => (
    <div
      key={cellKey(p)}
      className="absolute"
      style={{
        left: p.x * cell,
        top: p.y * cell,
        width: cell,
        height: cell,
        backgroundColor: cssColor(p.color),
      }}
    />
  ))
}

type FieldViewProps = { field: Field; cell: number }

// A column as runs: each colored cell on its own, and each stretch of open sky as one run.
function columnRuns(colors: (TailwindColor | null)[]) {
  const runs: { color: TailwindColor | null; rows: number }[] = []
  for (const color of colors) {
    const last = runs.at(-1)
    if (color === null && last?.color === null) last.rows++
    else runs.push({ color, rows: 1 })
  }
  return runs
}

// Every pixel of the field as a div. Rendered once; the camera moves it with a transform.
// Open sky is transparent so the backdrop and sky show through, and each stretch of it is
// a single div rather than one per cell: most of the field is sky.
export const FieldView = memo(function FieldView({ field, cell }: FieldViewProps) {
  const columns = useMemo(() => field.columns.map(columnRuns), [field])
  return (
    <div className="flex">
      {columns.map((runs, x) => (
        <div key={x} className="flex shrink-0 flex-col" style={{ width: cell }}>
          {runs.map((run, i) => (
            <div
              key={i}
              style={{
                height: run.rows * cell,
                backgroundColor: run.color ? cssColor(run.color) : undefined,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  )
})

type SkyViewProps = { sky: TailwindColor[]; rows: number; cell: number; opacity?: number }

// The sky never moves, so it's a single div: one vertical gradient with a hard stop at
// each band's edge.
export const SkyView = memo(function SkyView({ sky, rows, cell, opacity }: SkyViewProps) {
  const background = useMemo(() => {
    const stops = skyBands(rows, sky).map(
      (band) => `${cssColor(band.color)} ${band.top * cell}px ${band.bottom * cell}px`,
    )
    return `linear-gradient(${stops.join(', ')})`
  }, [sky, rows, cell])
  return (
    <div
      className="absolute inset-x-0 bottom-0"
      style={{ height: rows * cell, background, opacity }}
    />
  )
})

type BackdropViewProps = {
  pixels: Pixel[]
  width: number
  rows: number
  cell: number
}

// Clouds and the rainbow, one div per pixel. Scrolls slower than the field for parallax.
export const BackdropView = memo(function BackdropView({
  pixels,
  width,
  rows,
  cell,
}: BackdropViewProps) {
  return (
    <div className="relative" style={{ width: width * cell, height: rows * cell }}>
      <PixelDivs pixels={pixels} cell={cell} />
    </div>
  )
})

type SnailProps = { shape: Shape; left: number; ground: number; rows: number; cell: number }

// One snail, standing on the ground `ground` cells up from the bottom of a field `rows` tall.
const Snail = memo(function Snail({ shape, left, ground, rows, cell }: SnailProps) {
  return (
    <div
      className="absolute"
      style={{ left: left * cell, top: (rows - ground - shape.height) * cell }}
    >
      <PixelDivs pixels={shape.pixels} cell={cell} />
    </div>
  )
})

type SnailsProps = { field: Field; cell: number; tick: number; squished: number[] }

// The snails, drawn over the field since they move: their horns wiggle, each snail a few
// frames out of step with the one before, and they flatten for a moment when jumped on.
export const Snails = memo(function Snails({ field, cell, tick, squished }: SnailsProps) {
  return field.snails.map((snail, i) => {
    const isSquished = squished.includes(i)
    return (
      <Snail
        key={i}
        shape={isSquished ? SNAIL_SQUISHED : SNAIL_FRAMES[(tick + i * 2) % SNAIL_FRAMES.length]}
        left={isSquished ? snail.left - SQUISH_SPREAD : snail.left}
        ground={snail.ground}
        rows={field.rows}
        cell={cell}
      />
    )
  })
})

type UnicornProps = { sprite: Sprite; cell: number; facing: 1 | -1 }

export const Unicorn = memo(function Unicorn({ sprite, cell, facing }: UnicornProps) {
  return (
    <div
      className="relative"
      // The drawing faces right; mirror it when walking left.
      style={{
        width: sprite.width * cell,
        height: sprite.height * cell,
        transform: `scaleX(${facing})`,
      }}
    >
      <PixelDivs pixels={sprite.pixels} cell={cell} />
    </div>
  )
})

// The unicorn drawn small as an SVG, for the button that opens the editor.
export function SpriteIcon({ sprite }: { sprite: Sprite }) {
  return (
    <svg
      className="h-12 w-auto"
      viewBox={`0 0 ${sprite.width} ${sprite.height}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <PixelRects pixels={sprite.pixels} />
    </svg>
  )
}
