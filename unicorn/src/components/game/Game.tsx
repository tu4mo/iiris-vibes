import { useState } from 'react'
import type { Drawing } from '../../drawing/types'
import { LEVELS } from '../../game/levels'
import { LevelRun } from './LevelRun'

type GameProps = {
  drawing: Drawing
  // While true (the editor is open) the game ignores the keyboard and stands still.
  paused: boolean
  onEdit: () => void
}

// Plays the levels in order. Each run of a level gets its own field: moving on or playing
// again remounts the run with a new key. After the last level, it starts over.
export function Game(props: GameProps) {
  const [{ level, run }, setProgress] = useState({ level: 0, run: 0 })
  const last = level === LEVELS.length - 1
  return (
    <LevelRun
      key={run}
      {...props}
      level={LEVELS[level]}
      continueLabel={last ? 'Play again' : 'Continue'}
      onContinue={() => setProgress((p) => ({ level: last ? 0 : p.level + 1, run: p.run + 1 }))}
    />
  )
}
