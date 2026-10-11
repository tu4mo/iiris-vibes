import type { TailwindColor } from './colors'
import type { Cell } from './grid'

export type Pixel = Cell & { color: TailwindColor }

// A pixel-art shape. Pixels count from the top-left corner, with y going down, and the
// bottom row (y = height - 1) is the one that rests on the ground.
export type Shape = { width: number; height: number; pixels: Pixel[] }

export type Layer = {
  id: string
  name: string
  visible: boolean
  pixels: Pixel[]
}

// Layers are ordered bottom to top; later layers paint over earlier ones.
export type Drawing = { layers: Layer[] }
