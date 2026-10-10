import type { TailwindColor } from '../drawing/colors'
import { outlinedPixels, toShapes, type Shape } from './shape'

// A pixel-art castle, generated from simple shapes. Coordinates: x from the castle's
// left edge, u = rows above the ground (u = 0 sits directly on the grass).

const CASTLE_WIDTH = 84
// The doorway the unicorn walks into, as a column range within the castle.
const DOOR_LEFT = 26
const DOOR_WIDTH = 32
const DOOR_HEIGHT = 36

const SIDE_TOWER = { width: 14, height: 52, roof: 12 }
const KEEP = { left: 14, right: 69, height: 40 }
const CENTER_TOWER = { left: 34, right: 49, height: 56, roof: 12 }

type Part = 'left' | 'right' | 'center' | 'keep'
// What a cell of the castle is made of, and which part it belongs to.
type Piece = { kind: 'stone' | 'roof' | 'pole' | 'flag'; part: Part }

// Each part of the castle gets its own pastel bricks, roof and flag.
const PALETTE: Record<
  Part,
  {
    brick: [TailwindColor, TailwindColor]
    mortar: TailwindColor
    roof: [TailwindColor, TailwindColor]
    flag: TailwindColor
  }
> = {
  left: {
    brick: ['violet-100', 'violet-200'],
    mortar: 'violet-300',
    roof: ['rose-400', 'pink-500'],
    flag: 'green-400',
  },
  right: {
    brick: ['violet-100', 'violet-200'],
    mortar: 'violet-300',
    roof: ['sky-400', 'sky-500'],
    flag: 'rose-400',
  },
  center: {
    brick: ['sky-100', 'sky-200'],
    mortar: 'sky-300',
    roof: ['violet-400', 'violet-500'],
    flag: 'amber-300',
  },
  keep: {
    brick: ['pink-100', 'pink-200'],
    mortar: 'pink-300',
    roof: ['rose-400', 'pink-500'],
    flag: 'amber-300',
  },
}

function inRoof(x: number, u: number, left: number, width: number, base: number, rows: number) {
  // A cone overhanging the tower by one cell on each side, narrowing to a point.
  const k = u - base
  if (k < 0 || k >= rows) return false
  const center = left + (width - 1) / 2
  const half = (width / 2 + 1) * (1 - k / rows)
  return Math.abs(x - center) <= half
}

// Each roof gets a flag: a pole of 6 cells and a 5x3 pennant to the right.
function flagKind(x: number, u: number, left: number, width: number, top: number) {
  const pole = left + Math.floor(width / 2)
  if (x === pole && u >= top && u < top + 6) return 'pole'
  if (x > pole && x <= pole + 5 && u >= top + 3 && u < top + 6) return 'flag'
  return null
}

function pieceAt(x: number, u: number): Piece | null {
  const towers: { part: Part; left: number }[] = [
    { part: 'left', left: 0 },
    { part: 'right', left: CASTLE_WIDTH - SIDE_TOWER.width },
  ]
  for (const { part, left } of towers) {
    const flag = flagKind(x, u, left, SIDE_TOWER.width, SIDE_TOWER.height + SIDE_TOWER.roof - 1)
    if (flag) return { kind: flag, part }
    if (x >= left && x < left + SIDE_TOWER.width && u < SIDE_TOWER.height) {
      return { kind: 'stone', part }
    }
    if (inRoof(x, u, left, SIDE_TOWER.width, SIDE_TOWER.height, SIDE_TOWER.roof)) {
      return { kind: 'roof', part }
    }
  }

  const centerWidth = CENTER_TOWER.right - CENTER_TOWER.left + 1
  const flag = flagKind(
    x,
    u,
    CENTER_TOWER.left,
    centerWidth,
    CENTER_TOWER.height + CENTER_TOWER.roof - 1,
  )
  if (flag) return { kind: flag, part: 'center' }
  // The center tower rises above the keep; below the keep's top it's part of the keep wall.
  if (x >= CENTER_TOWER.left && x <= CENTER_TOWER.right && u < CENTER_TOWER.height) {
    return { kind: 'stone', part: u < KEEP.height ? 'keep' : 'center' }
  }
  if (inRoof(x, u, CENTER_TOWER.left, centerWidth, CENTER_TOWER.height, CENTER_TOWER.roof)) {
    return { kind: 'roof', part: 'center' }
  }

  if (x >= KEEP.left && x <= KEEP.right) {
    if (u < KEEP.height) return { kind: 'stone', part: 'keep' }
    // Crenellations: 4-wide merlons with 3-wide gaps.
    if (u < KEEP.height + 3 && (x - KEEP.left) % 7 < 4) return { kind: 'stone', part: 'keep' }
  }
  return null
}

function inDoor(x: number, u: number) {
  if (x < DOOR_LEFT || x >= DOOR_LEFT + DOOR_WIDTH || u >= DOOR_HEIGHT) return false
  // Round the top into an arch.
  const archStart = DOOR_HEIGHT - 8
  if (u < archStart) return true
  const dx = (x + 0.5 - (DOOR_LEFT + DOOR_WIDTH / 2)) / (DOOR_WIDTH / 2)
  const du = (u + 0.5 - archStart) / 8
  return dx * dx + du * du <= 1
}

function inWindow(x: number, u: number) {
  const windowRows = (u >= 16 && u < 22) || (u >= 34 && u < 40)
  const towerWindow = (x >= 5 && x < 9) || (x >= CASTLE_WIDTH - 9 && x < CASTLE_WIDTH - 5)
  const centerWindow = x >= 39 && x < 45 && u >= 44 && u < 50
  return (windowRows && towerWindow) || centerWindow
}

// Bricks: 3-row courses, 7-wide bricks offset on alternate courses, two tones.
function brickColor(x: number, u: number, part: Part): TailwindColor {
  const { brick, mortar } = PALETTE[part]
  if (u % 4 === 3) return mortar
  const offset = Math.floor(u / 4) % 2 === 0 ? 0 : 3
  if ((x + offset) % 7 === 0) return mortar
  return (x * 7 + u * 13) % 5 === 0 ? brick[1] : brick[0]
}

function colorAt(x: number, u: number): TailwindColor | null {
  const piece = pieceAt(x, u)
  if (piece === null) return null
  const colors = PALETTE[piece.part]
  if (piece.kind === 'pole') return 'slate-500'
  if (piece.kind === 'flag') return colors.flag
  if (piece.kind === 'roof') return colors.roof[Math.floor(u / 2) % 2]
  if (inDoor(x, u)) return 'indigo-950'
  // A two-cell golden arch around the doorway.
  const nearDoor = (d: number) =>
    [
      [d, 0],
      [-d, 0],
      [0, d],
      [d, d],
      [-d, d],
    ].some(([dx, du]) => inDoor(x + dx, u + du))
  if (nearDoor(1)) return 'amber-300'
  if (nearDoor(2)) return 'amber-400'
  if (inWindow(x, u)) return 'amber-300'
  return brickColor(x, u, piece.part)
}

const { shapes, left } = toShapes([
  outlinedPixels(CASTLE_WIDTH, CENTER_TOWER.height + CENTER_TOWER.roof + 6, colorAt),
])

// The whole castle, outlined.
export const CASTLE: Shape = shapes[0]
// The doorway's left column in the outlined shape, which starts at the outline's column.
export const CASTLE_DOOR_LEFT = DOOR_LEFT - left
