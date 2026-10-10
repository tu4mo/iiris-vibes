import { cellKey, type Cell } from './grid'
import type { Drawing, Layer, Pixel } from './types'

// Replace one layer's pixels, leaving the rest of the drawing as is.
export function updateLayerPixels(
  drawing: Drawing,
  layerId: string,
  update: (pixels: Pixel[]) => Pixel[],
): Drawing {
  return {
    ...drawing,
    layers: drawing.layers.map((layer) =>
      layer.id === layerId ? { ...layer, pixels: update(layer.pixels) } : layer,
    ),
  }
}

export function findLayer(drawing: Drawing, layerId: string): Layer | undefined {
  return drawing.layers.find((l) => l.id === layerId)
}

export type CompositePixel = Pixel & { layerId: string }

// Visible layers flattened bottom to top, so upper layers win. Keyed by cellKey;
// each pixel remembers which layer it came from.
export function compositePixels(drawing: Drawing): Map<string, CompositePixel> {
  const pixels = new Map<string, CompositePixel>()
  for (const layer of drawing.layers) {
    if (!layer.visible) continue
    for (const p of layer.pixels) pixels.set(cellKey(p), { ...p, layerId: layer.id })
  }
  return pixels
}

// The visible color at a cell, from the topmost layer that has a pixel there.
export function colorAt(drawing: Drawing, cell: Cell) {
  return compositePixels(drawing).get(cellKey(cell))?.color
}
