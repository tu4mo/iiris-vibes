export const GRID_SIZE = 48

export type Cell = { x: number; y: number }

// Stable string key for a cell, for maps and React keys.
export function cellKey({ x, y }: Cell) {
  return `${x},${y}`
}
