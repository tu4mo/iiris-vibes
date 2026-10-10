import { useMemo, useRef, type PointerEvent } from 'react'
import { cssColor } from '../../drawing/colors'
import { GRID_SIZE, cellKey, type Cell } from '../../drawing/grid'
import { compositePixels } from '../../drawing/layers'
import { lineCells } from '../../drawing/paint'
import type { Drawing } from '../../drawing/types'
import { maneBorderStyle } from '../mane'

const cells: Cell[] = Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => ({
  x: i % GRID_SIZE,
  y: Math.floor(i / GRID_SIZE),
}))

type CanvasProps = {
  drawing: Drawing
  // Called with the cells a click or drag passes over; the caller decides what to paint.
  onPaint: (cells: Cell[]) => void
  // When set, clicks pick a single cell instead of starting a paint stroke.
  onPick?: (cell: Cell) => void
}

export function Canvas({ drawing, onPaint, onPick }: CanvasProps) {
  const pixels = useMemo(() => compositePixels(drawing), [drawing])

  const gridRef = useRef<HTMLDivElement>(null)
  // Last cell painted in the current stroke; null when not painting or off the grid.
  const lastCell = useRef<Cell | null>(null)
  const painting = useRef(false)

  // Hit-test by position: with pointer capture, event.target stays on the grid.
  function cellAt(event: PointerEvent): Cell | null {
    const el = document.elementFromPoint(event.clientX, event.clientY)
    if (!(el instanceof HTMLElement) || el.parentElement !== gridRef.current) return null
    return { x: Number(el.dataset.x), y: Number(el.dataset.y) }
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return
    const cell = cellAt(event)
    if (!cell) return
    if (onPick) {
      onPick(cell)
      return
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    painting.current = true
    lastCell.current = cell
    onPaint([cell])
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!painting.current) return
    const cell = cellAt(event)
    const last = lastCell.current
    lastCell.current = cell
    if (!cell || (last && last.x === cell.x && last.y === cell.y)) return
    // Re-entering the grid starts a new segment instead of joining across the gap.
    onPaint(last ? lineCells(last, cell) : [cell])
  }

  function stopPainting() {
    painting.current = false
    lastCell.current = null
  }

  return (
    <main
      className="relative flex min-w-0 items-center justify-center overflow-hidden [container-type:size]"
      aria-label="Canvas"
    >
      {/* Rainbow frame, matching the toolbar, so the board stands out from the app's grid. */}
      <div
        className="size-[min(90cqw,90cqh)] overflow-hidden rounded-lg border-4 border-transparent"
        style={maneBorderStyle}
      >
        <div
          ref={gridRef}
          className="grid size-full cursor-crosshair touch-none gap-px select-none bg-zinc-800"
          style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={stopPainting}
          onPointerCancel={stopPainting}
          onLostPointerCapture={stopPainting}
        >
          {cells.map((cell) => {
            const color = pixels.get(cellKey(cell))?.color
            return (
              <div
                key={cellKey(cell)}
                data-x={cell.x}
                data-y={cell.y}
                className="bg-black"
                style={color ? { backgroundColor: cssColor(color) } : undefined}
              />
            )
          })}
        </div>
      </div>
    </main>
  )
}
