import type { TailwindColor } from './colors'
import { cellKey, type Cell } from './grid'
import { findLayer, updateLayerPixels } from './layers'
import type { Drawing, Pixel } from './types'

// Tools that change pixels.
export type PaintTool = 'draw' | 'erase'

// Every canvas tool; 'pick' reads a pixel's color instead of changing it.
export type Tool = PaintTool | 'pick'

// Paint or erase cells in one layer. Returns the same drawing when nothing changes,
// so React can skip the re-render.
export function paintCells(
  drawing: Drawing,
  layerId: string,
  cells: Cell[],
  tool: PaintTool,
  color: TailwindColor,
): Drawing {
  const layer = findLayer(drawing, layerId)
  if (!layer) return drawing
  const pixels = new Map<string, Pixel>(layer.pixels.map((p) => [cellKey(p), p]))
  let changed = false
  for (const cell of cells) {
    const key = cellKey(cell)
    if (tool === 'erase') {
      if (pixels.delete(key)) changed = true
    } else if (pixels.get(key)?.color !== color) {
      pixels.set(key, { ...cell, color })
      changed = true
    }
  }
  return changed ? updateLayerPixels(drawing, layerId, () => [...pixels.values()]) : drawing
}

// Cells on the straight line from a to b (Bresenham), so fast drags don't leave gaps.
export function lineCells(a: Cell, b: Cell): Cell[] {
  const cells: Cell[] = []
  const dx = Math.abs(b.x - a.x)
  const dy = -Math.abs(b.y - a.y)
  const sx = a.x < b.x ? 1 : -1
  const sy = a.y < b.y ? 1 : -1
  let { x, y } = a
  let err = dx + dy
  for (;;) {
    cells.push({ x, y })
    if (x === b.x && y === b.y) return cells
    const e2 = 2 * err
    if (e2 >= dy) {
      err += dy
      x += sx
    }
    if (e2 <= dx) {
      err += dx
      y += sy
    }
  }
}
