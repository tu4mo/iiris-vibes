import { useState } from 'react'
import type { Drawing } from '../../drawing/types'
import { LEVELS } from '../../game/levels'
import { LevelRun } from './LevelRun'
import { useMusic } from './useMusic'

type GameProps = {
  drawing: Drawing
  // While true (the editor is open) the game ignores the keyboard and stands still.
  paused: boolean
  onEdit: () => void
}

type Progress = {
  level: number
  // Counts every level started, so each one remounts with a fresh field.
  run: number
  // The dress style the unicorn is wearing, carried from one level to the next.
  dress: number | null
}

// Plays the levels in order: reaching a level's exit goes straight on to the next one,
// and the last one's exit starts the game over from the first, without a dress.
export function Game(props: GameProps) {
  const [{ level, run, dress }, setProgress] = useState<Progress>({
    level: 0,
    run: 0,
    dress: null,
  })

  const { muted, toggleMuted } = useMusic(LEVELS[level].music)

  function handleExit(wearing: number | null) {
    setProgress((p) =>
      p.level < LEVELS.length - 1
        ? { level: p.level + 1, run: p.run + 1, dress: wearing }
        : { level: 0, run: p.run + 1, dress: null },
    )
  }

  return (
    <LevelRun
      key={run}
      {...props}
      level={LEVELS[level]}
      dress={dress}
      onExit={handleExit}
      fadeIn={run > 0}
      muted={muted}
      onToggleMuted={toggleMuted}
    />
  )
}
