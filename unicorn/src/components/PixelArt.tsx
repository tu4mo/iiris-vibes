import { useId } from 'react'
import { cssColor, type TailwindColor } from '../drawing/colors'
import { GRID_SIZE, cellKey } from '../drawing/grid'
import { compositePixels } from '../drawing/layers'
import type { Drawing } from '../drawing/types'

type PixelArtProps = {
  drawing: Drawing
  // Omit for decorative previews; they're hidden from screen readers.
  label?: string
  // When set, only this layer is in color; the rest is drawn dim and gray.
  highlightLayerId?: string
  className?: string
}

// Pixels as 1x1 SVG rects, for an SVG whose viewBox is in cells.
export function PixelRects({
  pixels,
}: {
  pixels: { x: number; y: number; color: TailwindColor }[]
}) {
  return pixels.map((p) => (
    <rect
      key={cellKey(p)}
      x={p.x}
      y={p.y}
      width={1}
      height={1}
      style={{ fill: cssColor(p.color) }}
    />
  ))
}

// Static SVG rendering of a drawing, showing the whole canvas.
export function PixelArt({ drawing, label, highlightLayerId, className }: PixelArtProps) {
  // useId can contain characters that break url(#...) references.
  const grayscaleId = `grayscale-${useId().replace(/[^\w-]/g, '')}`
  const pixels = [...compositePixels(drawing).values()]

  const dimmed = highlightLayerId ? pixels.filter((p) => p.layerId !== highlightLayerId) : []
  const bright = highlightLayerId ? pixels.filter((p) => p.layerId === highlightLayerId) : pixels

  return (
    <svg
      className={className}
      viewBox={`0 0 ${GRID_SIZE} ${GRID_SIZE}`}
      shapeRendering="crispEdges"
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
    >
      {dimmed.length > 0 && (
        <>
          <filter id={grayscaleId}>
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <g filter={`url(#${grayscaleId})`} opacity={0.3}>
            <PixelRects pixels={dimmed} />
          </g>
        </>
      )}
      <PixelRects pixels={bright} />
    </svg>
  )
}
