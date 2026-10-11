import { updateLayerPixels } from '../drawing/layers'
import type { Drawing, Layer, Pixel } from '../drawing/types'
import {
  UNICORN_BODY,
  UNICORN_EYE,
  UNICORN_EYE_CLOSED,
  UNICORN_EYE_OPEN,
  UNICORN_HAIR,
} from '../game/sprites/unicorn'
import type { Shape } from '../drawing/types'

// The layer the pencil and eraser work on, above the built-in unicorn, so the user's
// drawing never changes the preset layers.
export const USER_LAYER_ID = 'user'
const EYE_LAYER_ID = 'eye'

// Where the unicorn sprite's top-left corner goes on the 48x48 grid, to center it.
const ORIGIN = { x: 10, y: 9 }

// A sprite's pixels on the grid, at `at` in the unicorn's frame.
function placed(shape: Shape, at = { x: 0, y: 0 }): Pixel[] {
  return shape.pixels.map(({ x, y, color }) => ({
    x: ORIGIN.x + at.x + x,
    y: ORIGIN.y + at.y + y,
    color,
  }))
}

const eyeLayer: Layer = {
  id: EYE_LAYER_ID,
  name: 'Eye',
  visible: true,
  pixels: placed(UNICORN_EYE_OPEN, UNICORN_EYE),
}

// Layers, bottom to top: the body, the hair, the eye, and the user's own layer, empty to
// start.
export const defaultDrawing: Drawing = {
  layers: [
    { id: 'body', name: 'Body', visible: true, pixels: placed(UNICORN_BODY) },
    { id: 'hair', name: 'Hair', visible: true, pixels: placed(UNICORN_HAIR) },
    eyeLayer,
    { id: USER_LAYER_ID, name: 'My drawing', visible: true, pixels: [] },
  ],
}

// Brings drawings saved by older versions up to date: the stars or rainbow background
// layer is dropped, an empty user layer is added on top if there isn't one, and an eye
// layer below it. Older bodies still have the eye in them, and the eye layer covers it.
export function normalizeDrawing(drawing: Drawing): Drawing {
  const layers = drawing.layers.filter((l) => l.id !== 'background')
  if (!layers.some((l) => l.id === USER_LAYER_ID)) layers.push(defaultDrawing.layers.at(-1)!)
  if (!layers.some((l) => l.id === EYE_LAYER_ID)) layers.splice(-1, 0, eyeLayer)
  return { ...drawing, layers }
}

// The drawing mid-blink: the eye layer showing the closed eye.
export function withEyeClosed(drawing: Drawing): Drawing {
  return updateLayerPixels(drawing, EYE_LAYER_ID, () => placed(UNICORN_EYE_CLOSED, UNICORN_EYE))
}
