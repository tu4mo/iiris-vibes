import { useEffect, useState } from 'react'
import type { TailwindColor } from '../drawing/colors'
import type { Cell } from '../drawing/grid'
import { paintCells, type PaintTool } from '../drawing/paint'
import { loadDrawing, saveDrawing } from '../drawing/storage'
import type { Drawing } from '../drawing/types'
import { USER_LAYER_ID, defaultDrawing, normalizeDrawing } from '../presets/defaultDrawing'
import { applyHairStyle, type HairStyle } from '../presets/hairStyles'

const SAVE_DELAY = 300 // ms

// The drawing being edited, persisted to localStorage, with the edits the UI can make.
export function useDrawing() {
  const [drawing, setDrawing] = useState<Drawing>(() =>
    normalizeDrawing(loadDrawing() ?? defaultDrawing),
  )

  // Saved a moment after the last change, so a stroke isn't serialized on every move, and
  // straight away if the page is closed before then.
  useEffect(() => {
    const save = () => saveDrawing(drawing)
    const timer = setTimeout(save, SAVE_DELAY)
    window.addEventListener('pagehide', save)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('pagehide', save)
    }
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
