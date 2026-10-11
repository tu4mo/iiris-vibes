import { useState } from 'react'
import type { Drawing } from '../../drawing/types'
import { LEVELS } from '../../game/levels'
import { maneBorderStyle } from '../mane'
import { LevelRun } from './LevelRun'

type GameProps = {
  drawing: Drawing
  // While true (the editor is open) the game ignores the keyboard and stands still.
  paused: boolean
  onEdit: () => void
}

// Plays the levels in order: reaching a level's exit goes straight on to the next one, and
// the last one's exit ends the game. Each run of a level gets its own field: moving on or
// playing again remounts the run with a new key.
export function Game(props: GameProps) {
  const [{ level, run }, setProgress] = useState({ level: 0, run: 0 })
  const [over, setOver] = useState(false)

  function handleExit() {
    if (level < LEVELS.length - 1) setProgress((p) => ({ level: p.level + 1, run: p.run + 1 }))
    else setOver(true)
  }
  function playAgain() {
    setOver(false)
    setProgress((p) => ({ level: 0, run: p.run + 1 }))
  }

  return (
    <>
      <LevelRun key={run} {...props} level={LEVELS[level]} onExit={handleExit} fadeIn={level > 0} />
      {over && (
        <div className="fixed inset-0 flex items-center justify-center bg-indigo-950/40">
          <div
            role="dialog"
            aria-labelledby="game-over-title"
            className="flex flex-col items-center gap-4 rounded-2xl border-4 border-transparent px-8 py-6 text-sky-100"
            style={maneBorderStyle}
          >
            <h2 id="game-over-title" className="text-2xl font-semibold text-white">
              You found the secret passage!
            </h2>
            <div className="flex gap-3">
              <button
                type="button"
                autoFocus
                className="rounded-lg bg-sky-300 px-4 py-2 font-medium text-indigo-950 hover:bg-sky-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
                onClick={playAgain}
              >
                Play again
              </button>
              <button
                type="button"
                className="rounded-lg px-4 py-2 font-medium hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
                onClick={props.onEdit}
              >
                Edit unicorn
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
