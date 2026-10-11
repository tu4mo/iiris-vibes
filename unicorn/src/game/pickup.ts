import { DIAMOND_SHAPES } from './sprites/diamond'
import { DRESS_SHAPES } from './sprites/dress'
import type { Pickup } from './field'

// What each kind of pickup looks like, by style.
const SHAPES = { dress: DRESS_SHAPES, diamond: DIAMOND_SHAPES }

export function pickupShape(pickup: Pickup) {
  return SHAPES[pickup.kind][pickup.style]
}

// How high a pickup's bottom is, in cells from the bottom of the field.
export function pickupBottom(pickup: Pickup, spriteHeight: number) {
  return pickup.ground + pickup.lift + (pickup.overHead ? spriteHeight : 0)
}
