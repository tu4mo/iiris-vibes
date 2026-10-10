import { useEffect, useState } from 'react'
import type { TailwindColor } from '../drawing/colors'
import type { Cell } from '../drawing/grid'
import { paintCells, type PaintTool } from '../drawing/paint'
import { loadDrawing, saveDrawing } from '../drawing/storage'
import type { Drawing } from '../drawing/types'
import { USER_LAYER_ID, defaultDrawing, normalizeDrawing } from '../presets/defaultDrawing'
import { applyHairStyle, type HairStyle } from '../presets/hairStyles'

// The drawing being edited, persisted to localStorage, with the edits the UI can make.
export function useDrawing() {
  const [drawing, setDrawing] = useState<Drawing>(() =>
    normalizeDrawing(loadDrawing() ?? defaultDrawing),
  )

  useEffect(() => {
    saveDrawing(drawing)
  }, [drawing])

  function paint(cells: Cell[], tool: PaintTool, color: TailwindColor) {
    // Only the user's own layer: erasing can't remove the built-in unicorn.
    setDrawing((prev) => paintCells(prev, USER_LAYER_ID, cells, tool, color))
  }

  return {
    drawing,
    paint,
    reset: () => setDrawing(defaultDrawing),
    setHairStyle: (style: HairStyle) => setDrawing((prev) => applyHairStyle(prev, style)),
  }
}
