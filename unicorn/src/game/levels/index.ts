import { CASTLE_HALL } from './castleHall'
import type { Level } from './level'
import { MEADOW } from './meadow'

export type { Level } from './level'

// The levels in the order they're played. Finishing one moves on to the next.
export const LEVELS: Level[] = [MEADOW, CASTLE_HALL]
