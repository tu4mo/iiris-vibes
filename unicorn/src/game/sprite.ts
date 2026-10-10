import { cellKey, type Cell } from '../drawing/grid'
import { compositePixels } from '../drawing/layers'
import type { Drawing, Pixel } from '../drawing/types'
import { SIDES, type Shape } from './shape'

// The unicorn in the game: a shape cropped from the drawing.
export type Sprite = Shape

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

// The cell next to `cell` in direction [dx, dy].
const step = (cell: Cell, [dx, dy]: readonly [number, number]) => ({
  x: cell.x + dx,
  y: cell.y + dy,
})

// Groups of pixels connected edge to edge.
function connectedGroups(pixels: Pixel[]): Pixel[][] {
  const byKey = new Map(pixels.map((p) => [cellKey(p), p]))
  const seen = new Set<string>()
  const groups: Pixel[][] = []
  for (const start of pixels) {
    if (seen.has(cellKey(start))) continue
    const group: Pixel[] = []
    const stack = [start]
    seen.add(cellKey(start))
    while (stack.length > 0) {
      const p = stack.pop()!
      group.push(p)
      for (const side of SIDES) {
        const key = cellKey(step(p, side))
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
function findLegs(sprite: Sprite): Pixel[][] {
  let legs: Pixel[][] = []
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
  const legIndex = new Map<Pixel, number>()
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

// The eye: the largest blob in the outline's color that sits fully inside the sprite,
// plus any highlight pixels it surrounds. Returns the pixels to draw it closed: the eye
// filled with the surrounding skin color, keeping its bottom row as a dark lid line. Null
// when no eye can be found.
export function findEye(sprite: Sprite): Pixel[] | null {
  const byKey = new Map(sprite.pixels.map((p) => [cellKey(p), p]))
  const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < sprite.width && y < sprite.height

  // Empty cells reachable from outside the sprite.
  const exterior = new Set<string>()
  const stack: [number, number][] = []
  for (let x = -1; x <= sprite.width; x++) stack.push([x, -1], [x, sprite.height])
  for (let y = 0; y < sprite.height; y++) stack.push([-1, y], [sprite.width, y])
  while (stack.length > 0) {
    const [x, y] = stack.pop()!
    const key = cellKey({ x, y })
    if (exterior.has(key) || byKey.has(key)) continue
    if (x < -1 || y < -1 || x > sprite.width || y > sprite.height) continue
    exterior.add(key)
    for (const [dx, dy] of SIDES) stack.push([x + dx, y + dy])
  }
  const touchesOutside = (p: Pixel) =>
    SIDES.some((side) => {
      const n = step(p, side)
      return exterior.has(cellKey(n)) || !inside(n.x, n.y)
    })

  const outlineColor = mostCommon(sprite.pixels.filter(touchesOutside).map((p) => p.color))
  const candidates = connectedGroups(
    sprite.pixels.filter((p) => p.color === outlineColor && !touchesOutside(p)),
  )
    // Blobs connected to the outline aren't eyes.
    .filter((group) =>
      group.every((p) =>
        SIDES.every((side) => {
          const n = byKey.get(cellKey(step(p, side)))
          return !n || n.color !== outlineColor || group.includes(n)
        }),
      ),
    )
    .sort((a, b) => b.length - a.length)
  const eye = candidates[0]
  if (!eye || eye.length < 2) return null

  const eyeCells: Cell[] = [...eye]
  const eyeKeys = new Set(eyeCells.map(cellKey))
  // Highlights: pixels whose every neighbour is part of the eye.
  for (const p of sprite.pixels) {
    if (!eyeKeys.has(cellKey(p)) && SIDES.every((side) => eyeKeys.has(cellKey(step(p, side))))) {
      eyeCells.push(p)
      eyeKeys.add(cellKey(p))
    }
  }
  const neighbours = eyeCells.flatMap((c) =>
    SIDES.map((side) => byKey.get(cellKey(step(c, side)))).filter(
      (n): n is Pixel => !!n && !eyeKeys.has(cellKey(n)),
    ),
  )
  const skin = mostCommon(neighbours.map((n) => n.color))
  if (!skin || !outlineColor) return null

  const bottom = Math.max(...eyeCells.map((c) => c.y))
  return eyeCells.map(({ x, y }) => ({ x, y, color: y === bottom ? outlineColor : skin }))
}

// A frame with the eye closed.
export function withEyeClosed(sprite: Sprite, closedEye: Pixel[]): Sprite {
  const colors = new Map(closedEye.map((p) => [cellKey(p), p.color]))
  return {
    ...sprite,
    pixels: sprite.pixels.map((p) => {
      const color = colors.get(cellKey(p))
      return color ? { ...p, color } : p
    }),
  }
}
