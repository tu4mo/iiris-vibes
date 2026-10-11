import type { Drawing, Pixel } from '../drawing/types'
import { UNICORN_BODY, UNICORN_HAIR } from '../game/sprites/unicorn'
import type { Shape } from '../game/shape'

// The layer the pencil and eraser work on, above the built-in unicorn, so the user's
// drawing never changes the preset layers.
export const USER_LAYER_ID = 'user'

// Where the unicorn sprite's top-left corner goes on the 48x48 grid, to center it.
const ORIGIN = { x: 10, y: 9 }

function placed(shape: Shape): Pixel[] {
  return shape.pixels.map(({ x, y, color }) => ({ x: ORIGIN.x + x, y: ORIGIN.y + y, color }))
}

// Layers, bottom to top: the body, the hair, and the user's own layer, empty to start.
export const defaultDrawing: Drawing = {
  layers: [
    { id: 'body', name: 'Body', visible: true, pixels: placed(UNICORN_BODY) },
    { id: 'hair', name: 'Hair', visible: true, pixels: placed(UNICORN_HAIR) },
    { id: USER_LAYER_ID, name: 'My drawing', visible: true, pixels: [] },
  ],
}

// Brings drawings saved by older versions up to date: the stars or rainbow background
// layer is dropped, and an empty user layer is added on top if there isn't one.
export function normalizeDrawing(drawing: Drawing): Drawing {
  const layers = drawing.layers.filter((l) => l.id !== 'background')
  if (!layers.some((l) => l.id === USER_LAYER_ID)) layers.push(defaultDrawing.layers.at(-1)!)
  return { ...drawing, layers }
}
