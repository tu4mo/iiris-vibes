import { useId } from 'react'
import { cssColor } from '../drawing/colors'
import { GRID_SIZE, cellKey } from '../drawing/grid'
import { compositePixels, type CompositePixel } from '../drawing/layers'
import type { Drawing } from '../drawing/types'

type PixelArtProps = {
  drawing: Drawing
  // Omit for decorative previews; they're hidden from screen readers.
  label?: string
  // When set, only this layer is in color; the rest is drawn dim and gray.
  highlightLayerId?: string
  className?: string
}

function rects(pixels: CompositePixel[]) {
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
            {rects(dimmed)}
          </g>
        </>
      )}
      {rects(bright)}
    </svg>
  )
}
