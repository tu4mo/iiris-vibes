// Seeded randomness for generating levels: the same seed always builds the same world.

// Deterministic pseudo-random number in [0, 1) for a seed and up to two coordinates.
export function hash(seed: number, a: number, b = 0): number {
  let h = seed ^ Math.imul(a, 374761393) ^ Math.imul(b, 668265263)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

export function pick<T>(items: readonly T[], r: number): T {
  return items[Math.floor(r * items.length)]
}

// Smooth noise: random heights every `spacing` columns, eased in between.
export function valueNoise(seed: number, column: number, spacing: number, salt: number) {
  const k = Math.floor(column / spacing)
  const t = column / spacing - k
  const eased = t * t * (3 - 2 * t)
  const a = hash(seed, k, salt)
  const b = hash(seed, k + 1, salt)
  return a + (b - a) * eased
}
