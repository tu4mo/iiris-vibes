import type { Drawing } from './types'

const STORAGE_KEY = 'unicorn-designer:drawing'

function isDrawing(value: unknown): value is Drawing {
  if (typeof value !== 'object' || value === null) return false
  const { layers } = value as { layers?: unknown }
  return (
    Array.isArray(layers) &&
    layers.every(
      (layer) =>
        typeof layer?.id === 'string' &&
        typeof layer.name === 'string' &&
        typeof layer.visible === 'boolean' &&
        Array.isArray(layer.pixels) &&
        layer.pixels.every(
          (p: unknown) =>
            typeof p === 'object' &&
            p !== null &&
            typeof (p as { x?: unknown }).x === 'number' &&
            typeof (p as { y?: unknown }).y === 'number' &&
            typeof (p as { color?: unknown }).color === 'string',
        ),
    )
  )
}

// Returns null when nothing usable is stored, or storage is unavailable.
export function loadDrawing(): Drawing | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return null
    const parsed: unknown = JSON.parse(raw)
    return isDrawing(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function saveDrawing(drawing: Drawing) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(drawing))
  } catch {
    // Storage can be full or blocked (e.g. private mode); keep working in memory.
  }
}
