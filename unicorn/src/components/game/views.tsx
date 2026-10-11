import { memo, useId, useMemo } from 'react'
import { cssColor, type TailwindColor } from '../../drawing/colors'
import { cellKey } from '../../drawing/grid'
import type { Pixel } from '../../drawing/types'
import { SNAIL_FRAMES, SNAIL_SQUISHED, SQUISH_SPREAD } from '../../game/sprites/snail'
import type { Shape } from '../../drawing/types'
import type { Sprite } from '../../game/sprites/unicorn'
import type { Field, Pickup } from '../../game/field'
import { pickupBottom, pickupShape } from '../../game/pickup'
import { skyBands, type Sky } from '../../game/sky'
import { wallBase, wallBlocks, type Wall } from '../../game/wall'
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
    // Positioned, so it paints over a wall behind it.
    <div className="relative flex">
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

type SkyViewProps = { sky: Sky; rows: number; cell: number; opacity?: number }

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

type WallViewProps = { wall: Wall; seed: number; width: number; rows: number; cell: number }

// An indoor wall behind the field, as one SVG scaled up to the cell size: its blocks over
// the base color, and a shadow fading down from the ceiling.
export const WallView = memo(function WallView({ wall, seed, width, rows, cell }: WallViewProps) {
  const shadowId = useId()
  const blocks = useMemo(() => wallBlocks(seed, wall, width, rows), [seed, wall, width, rows])
  return (
    <svg
      className="absolute top-0 left-0"
      width={width * cell}
      height={rows * cell}
      viewBox={`0 0 ${width} ${rows}`}
      preserveAspectRatio="none"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={shadowId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={cssColor(wall.ceiling)} />
          <stop offset="0.5" stopColor={cssColor(wall.ceiling)} stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width={width} height={rows} fill={cssColor(wallBase(wall))} />
      {blocks.map((b, i) => (
        <rect key={i} x={b.x} y={b.y} width={b.width} height={b.height} fill={cssColor(b.color)} />
      ))}
      <rect width={width} height={rows} fill={`url(#${CSS.escape(shadowId)})`} />
    </svg>
  )
})

type PlacedShapeProps = { shape: Shape; left: number; bottom: number; rows: number; cell: number }

// A shape whose bottom is `bottom` cells up from the bottom of a field `rows` tall.
const PlacedShape = memo(function PlacedShape({
  shape,
  left,
  bottom,
  rows,
  cell,
}: PlacedShapeProps) {
  return (
    <div
      className="absolute"
      style={{ left: left * cell, top: (rows - bottom - shape.height) * cell }}
    >
      <PixelDivs pixels={shape.pixels} cell={cell} />
    </div>
  )
})

type PickupsProps = { field: Field; cell: number; spriteHeight: number; collected: number[] }

// The dresses and diamonds not collected yet.
export const Pickups = memo(function Pickups({
  field,
  cell,
  spriteHeight,
  collected,
}: PickupsProps) {
  return field.pickups.map((pickup, i) =>
    collected.includes(i) ? null : (
      <PlacedShape
        key={i}
        shape={pickupShape(pickup)}
        left={pickup.left}
        bottom={pickupBottom(pickup, spriteHeight)}
        rows={field.rows}
        cell={cell}
      />
    ),
  )
})

type SnailsProps = { field: Field; cell: number; tick: number; squished: number[] }

// The snails, drawn over the field since they move: their horns wiggle, each snail a few
// frames out of step with the one before, and they flatten for a moment when jumped on.
export const Snails = memo(function Snails({ field, cell, tick, squished }: SnailsProps) {
  return field.snails.map((snail, i) => {
    const isSquished = squished.includes(i)
    return (
      <PlacedShape
        key={i}
        shape={isSquished ? SNAIL_SQUISHED : SNAIL_FRAMES[(tick + i * 2) % SNAIL_FRAMES.length]}
        left={isSquished ? snail.left - SQUISH_SPREAD : snail.left}
        bottom={snail.ground}
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

// A shape drawn small as an SVG: the unicorn on the button that opens the editor, and
// the pickups in the corner.
export function SpriteIcon({ sprite, className = 'h-12' }: { sprite: Sprite; className?: string }) {
  return (
    <svg
      className={`${className} w-auto`}
      viewBox={`0 0 ${sprite.width} ${sprite.height}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <PixelRects pixels={sprite.pixels} />
    </svg>
  )
}

type PickupTallyProps = { pickups: Pickup[]; collected: number[] }

// What's been collected so far, in the corner: each dress, grayed out until it's found, or
// a count of diamonds.
export function PickupTally({ pickups, collected }: PickupTallyProps) {
  const indexed = pickups.map((pickup, i) => ({ pickup, i }))
  const dresses = indexed.filter(({ pickup }) => pickup.kind === 'dress')
  const diamonds = indexed.filter(({ pickup }) => pickup.kind === 'diamond')
  const count = (items: typeof indexed) => items.filter(({ i }) => collected.includes(i)).length

  if (dresses.length > 0) {
    return (
      <div
        className="absolute top-3 right-3 flex gap-2 rounded-2xl bg-indigo-950/85 p-3"
        role="status"
        aria-label={`Dresses: ${count(dresses)} of ${dresses.length}`}
      >
        {dresses.map(({ pickup, i }) => (
          <div key={i} className={collected.includes(i) ? '' : 'opacity-40 grayscale'}>
            <SpriteIcon sprite={pickupShape(pickup)} className="h-8" />
          </div>
        ))}
      </div>
    )
  }
  if (diamonds.length > 0) {
    return (
      <div
        className="absolute top-3 right-3 flex items-center gap-3 rounded-2xl bg-indigo-950/85 px-4 py-3 text-lg font-semibold text-white tabular-nums"
        role="status"
        aria-label={`Diamonds: ${count(diamonds)} of ${diamonds.length}`}
      >
        <SpriteIcon sprite={pickupShape(diamonds[0].pickup)} className="h-6" />
        {count(diamonds)} / {diamonds.length}
      </div>
    )
  }
  return null
}
