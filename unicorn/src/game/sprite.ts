import type { TailwindColor } from '../drawing/colors'
import { compositePixels } from '../drawing/layers'
import type { Drawing } from '../drawing/types'

export type Sprite = {
  width: number
  height: number
  // Pixel positions relative to the sprite's top-left corner.
  pixels: { x: number; y: number; color: TailwindColor }[]
}

// The designed unicorn as a sprite: every visible layer, cropped tight.
export function spriteFromDrawing(drawing: Drawing): Sprite {
  const pixels = [...compositePixels(drawing).values()]
  if (pixels.length === 0) return { width: 0, height: 0, pixels: [] }
  const minX = Math.min(...pixels.map((p) => p.x))
  const minY = Math.min(...pixels.map((p) => p.y))
  return {
    width: Math.max(...pixels.map((p) => p.x)) - minX + 1,
    height: Math.max(...pixels.map((p) => p.y)) - minY + 1,
    pixels: pixels.map((p) => ({ x: p.x - minX, y: p.y - minY, color: p.color })),
  }
}

type SpritePixel = Sprite['pixels'][number]

// Groups of pixels connected edge to edge.
function connectedGroups(pixels: SpritePixel[]): SpritePixel[][] {
  const byKey = new Map(pixels.map((p) => [`${p.x},${p.y}`, p]))
  const seen = new Set<string>()
  const groups: SpritePixel[][] = []
  for (const start of pixels) {
    if (seen.has(`${start.x},${start.y}`)) continue
    const group: SpritePixel[] = []
    const stack = [start]
    seen.add(`${start.x},${start.y}`)
    while (stack.length > 0) {
      const p = stack.pop()!
      group.push(p)
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const key = `${p.x + dx},${p.y + dy}`
        const next = byKey.get(key)
        if (next && !seen.has(key)) {
          seen.add(key)
          stack.push(next)
        }
      }
    }
    groups.push(group)
  }
  return groups
}

// The legs: scanning up from the bottom, the rows where the pixels still form two or
// more separate shapes, before they join the body. Empty when no legs can be told apart.
function findLegs(sprite: Sprite): SpritePixel[][] {
  let legs: SpritePixel[][] = []
  for (let top = sprite.height - 1; top >= 0; top--) {
    const groups = connectedGroups(sprite.pixels.filter((p) => p.y >= top))
    if (groups.length >= 2) legs = groups
    else if (legs.length > 0) break
  }
  return legs.sort((a, b) => Math.min(...a.map((p) => p.x)) - Math.min(...b.map((p) => p.x)))
}

// Two walking frames: the lower half of each leg shifts a pixel back or forth,
// with neighbouring legs moving in opposite directions. Same as the sprite if no legs are found.
export function walkFrames(sprite: Sprite): [Sprite, Sprite] {
  const legs = findLegs(sprite)
  if (legs.length === 0) return [sprite, sprite]

  const legTop = Math.min(...legs.flat().map((p) => p.y))
  const hoovesFrom = legTop + Math.ceil((sprite.height - legTop) / 2)
  const legIndex = new Map<SpritePixel, number>()
  legs.forEach((leg, i) => leg.forEach((p) => legIndex.set(p, i)))

  function frame(phase: 1 | -1): Sprite {
    return {
      ...sprite,
      pixels: sprite.pixels.map((p) => {
        const leg = legIndex.get(p)
        if (leg === undefined || p.y < hoovesFrom) return p
        const x = p.x + (leg % 2 === 0 ? phase : -phase)
        // Keep pixels inside the sprite's bounds.
        return x >= 0 && x < sprite.width ? { ...p, x } : p
      }),
    }
  }
  return [frame(1), frame(-1)]
}

function mostCommon<T>(items: T[]): T | undefined {
  const counts = new Map<T, number>()
  for (const item of items) counts.set(item, (counts.get(item) ?? 0) + 1)
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0]
}

const SIDES = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
]

// The eye: the largest blob in the outline's color that sits fully inside the sprite,
// plus any highlight pixels it surrounds. Returns how to draw it closed: the eye filled
// with the surrounding skin color, keeping its bottom row as a dark lid line. Null when
// no eye can be found.
export function findEye(sprite: Sprite): Map<string, TailwindColor> | null {
  const byKey = new Map(sprite.pixels.map((p) => [`${p.x},${p.y}`, p]))
  const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < sprite.width && y < sprite.height

  // Empty cells reachable from outside the sprite.
  const exterior = new Set<string>()
  const stack: [number, number][] = []
  for (let x = -1; x <= sprite.width; x++) stack.push([x, -1], [x, sprite.height])
  for (let y = 0; y < sprite.height; y++) stack.push([-1, y], [sprite.width, y])
  while (stack.length > 0) {
    const [x, y] = stack.pop()!
    const key = `${x},${y}`
    if (exterior.has(key) || byKey.has(key)) continue
    if (x < -1 || y < -1 || x > sprite.width || y > sprite.height) continue
    exterior.add(key)
    for (const [dx, dy] of SIDES) stack.push([x + dx, y + dy])
  }
  const touchesOutside = (p: SpritePixel) =>
    SIDES.some(([dx, dy]) => exterior.has(`${p.x + dx},${p.y + dy}`) || !inside(p.x + dx, p.y + dy))

  const outlineColor = mostCommon(sprite.pixels.filter(touchesOutside).map((p) => p.color))
  const candidates = connectedGroups(
    sprite.pixels.filter((p) => p.color === outlineColor && !touchesOutside(p)),
  )
    // Blobs connected to the outline aren't eyes.
    .filter((group) =>
      group.every((p) =>
        SIDES.every(([dx, dy]) => {
          const n = byKey.get(`${p.x + dx},${p.y + dy}`)
          return !n || n.color !== outlineColor || group.includes(n)
        }),
      ),
    )
    .sort((a, b) => b.length - a.length)
  const eye = candidates[0]
  if (!eye || eye.length < 2) return null

  const eyeKeys = new Set(eye.map((p) => `${p.x},${p.y}`))
  // Highlights: pixels whose every neighbour is part of the eye.
  for (const p of sprite.pixels) {
    if (SIDES.every(([dx, dy]) => eyeKeys.has(`${p.x + dx},${p.y + dy}`)))
      eyeKeys.add(`${p.x},${p.y}`)
  }
  const neighbours = [...eyeKeys].flatMap((key) => {
    const [x, y] = key.split(',').map(Number)
    return SIDES.map(([dx, dy]) => byKey.get(`${x + dx},${y + dy}`)).filter(
      (n): n is SpritePixel => !!n && !eyeKeys.has(`${n.x},${n.y}`),
    )
  })
  const skin = mostCommon(neighbours.map((n) => n.color))
  if (!skin || !outlineColor) return null

  const bottom = Math.max(...[...eyeKeys].map((k) => Number(k.split(',')[1])))
  return new Map(
    [...eyeKeys].map((key) => [key, Number(key.split(',')[1]) === bottom ? outlineColor : skin]),
  )
}

// A frame with the eye closed.
export function withEyeClosed(sprite: Sprite, closedEye: Map<string, TailwindColor>): Sprite {
  return {
    ...sprite,
    pixels: sprite.pixels.map((p) => {
      const color = closedEye.get(`${p.x},${p.y}`)
      return color ? { ...p, color } : p
    }),
  }
}
