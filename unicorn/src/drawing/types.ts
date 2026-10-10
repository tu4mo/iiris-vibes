import type { TailwindColor } from './colors'
import type { Cell } from './grid'

export type Pixel = Cell & { color: TailwindColor }

export type Layer = {
  id: string
  name: string
  visible: boolean
  pixels: Pixel[]
}

// Layers are ordered bottom to top; later layers paint over earlier ones.
export type Drawing = { layers: Layer[] }
