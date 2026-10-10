import type { TailwindColor } from '../drawing/colors'
import { findLayer, updateLayerPixels } from '../drawing/layers'
import type { Drawing } from '../drawing/types'

export const HAIR_LAYER_ID = 'hair'

type Band = readonly [light: TailwindColor, dark: TailwindColor]

export type HairStyle = {
  id: string
  name: string
  // Five bands, top of the mane to the bottom, matching the default rainbow's layout.
  bands: readonly [Band, Band, Band, Band, Band]
}

export const HAIR_STYLES: readonly HairStyle[] = [
  {
    id: 'rainbow',
    name: 'Rainbow',
    bands: [
      ['rose-400', 'pink-600'],
      ['orange-300', 'amber-500'],
      ['green-300', 'teal-500'],
      ['sky-300', 'cyan-600'],
      ['violet-400', 'purple-800'],
    ],
  },
  {
    id: 'sunset',
    name: 'Sunset',
    bands: [
      ['rose-300', 'rose-600'],
      ['orange-300', 'orange-600'],
      ['amber-300', 'amber-600'],
      ['yellow-200', 'yellow-500'],
      ['red-400', 'red-700'],
    ],
  },
  {
    id: 'ocean',
    name: 'Ocean',
    bands: [
      ['cyan-200', 'cyan-500'],
      ['teal-300', 'teal-600'],
      ['sky-300', 'sky-600'],
      ['blue-300', 'blue-600'],
      ['indigo-400', 'indigo-700'],
    ],
  },
  {
    id: 'galaxy',
    name: 'Galaxy',
    bands: [
      ['fuchsia-400', 'fuchsia-700'],
      ['pink-300', 'pink-600'],
      ['violet-300', 'violet-600'],
      ['indigo-300', 'indigo-600'],
      ['purple-400', 'purple-800'],
    ],
  },
  {
    id: 'candy',
    name: 'Candy',
    bands: [
      ['pink-200', 'pink-400'],
      ['yellow-100', 'yellow-300'],
      ['emerald-200', 'emerald-400'],
      ['sky-200', 'sky-400'],
      ['violet-200', 'violet-400'],
    ],
  },
]

function slots(style: HairStyle): TailwindColor[] {
  return style.bands.flat()
}

// The style whose palette matches the most hair pixels, so no extra state is needed.
export function currentHairStyle(drawing: Drawing): HairStyle | null {
  const hair = findLayer(drawing, HAIR_LAYER_ID)
  if (!hair) return null
  let best: HairStyle | null = null
  let bestCount = 0
  for (const style of HAIR_STYLES) {
    const palette = new Set(slots(style))
    const count = hair.pixels.filter((p) => palette.has(p.color)).length
    if (count > bestCount) {
      best = style
      bestCount = count
    }
  }
  return best
}

// Swap each hair pixel's color for the same light/dark slot in the target style.
// Pixels in colors outside the current style (e.g. painted by hand) are left alone.
export function applyHairStyle(drawing: Drawing, to: HairStyle): Drawing {
  const from = currentHairStyle(drawing)
  if (!from || from.id === to.id) return drawing
  const fromSlots = slots(from)
  const toSlots = slots(to)
  return updateLayerPixels(drawing, HAIR_LAYER_ID, (pixels) =>
    pixels.map((p) => {
      const slot = fromSlots.indexOf(p.color)
      return slot === -1 ? p : { ...p, color: toSlots[slot] }
    }),
  )
}
