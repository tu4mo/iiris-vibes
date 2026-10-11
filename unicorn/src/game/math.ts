export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

// Eases t from 0 to 1, slow at both ends.
export const smoothstep = (t: number) => t * t * (3 - 2 * t)
