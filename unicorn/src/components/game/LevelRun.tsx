import { useEffect, useMemo, useRef, useState } from 'react'
import { cssColor } from '../../drawing/colors'
import type { Drawing } from '../../drawing/types'
import type { Level } from '../../game/levels'
import { findEye, spriteFromDrawing, walkFrames, withEyeClosed } from '../../game/sprite'
import { PencilIcon } from '../icons'
import { maneBorderStyle } from '../mane'
import { START_X, usePlayLoop } from './usePlayLoop'
import { BackdropView, FieldView, Snails, SkyView, SpriteIcon, Unicorn } from './views'

const MIN_CELL_SIZE = 4
// The backdrop moves at this fraction of the field's speed.
const PARALLAX = 0.35

type LevelRunProps = {
  level: Level
  drawing: Drawing
  // While true (the editor is open) the game ignores the keyboard and stands still.
  paused: boolean
  onEdit: () => void
  // The main button on the dialog shown at the exit, and what it does.
  continueLabel: string
  onContinue: () => void
}

// One play of a level, on a field generated for it. Remounted (with a new key) to play
// the level again or move on to another.
export function LevelRun({
  level,
  drawing,
  paused,
  onEdit,
  continueLabel,
  onContinue,
}: LevelRunProps) {
  const containerRef = useRef<HTMLElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  // Generated once per run, with a fresh random seed.
  const [seed] = useState(() => Math.floor(Math.random() * 2 ** 31))
  const [field] = useState(() => level.generate(seed))
  const sprite = useMemo(() => spriteFromDrawing(drawing), [drawing])
  const steps = useMemo(() => walkFrames(sprite), [sprite])
  // The same three poses with the eye closed, for blinking. Null if no eye was found.
  const blinking = useMemo(() => {
    const eye = findEye(sprite)
    if (!eye) return null
    return {
      standing: withEyeClosed(sprite, eye),
      steps: steps.map((f) => withEyeClosed(f, eye)),
    }
  }, [sprite, steps])

  const { x, facing, step, altitude, blink, hornTick, squished, finished } = usePlayLoop({
    field,
    sprite,
    steps,
    paused,
  })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver(([entry]) => {
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      })
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  // Round up so the field always fills the window's height; only the top rows of sky are cut off.
  const cell = Math.max(MIN_CELL_SIZE, Math.ceil(size.height / field.rows))
  const cols = Math.floor(size.width / cell)
  // Follow the unicorn, but stop at the field's ends (or center a field narrower than the window).
  const ideal = x + Math.floor(sprite.width / 2) - Math.floor(cols / 2)
  const cameraX =
    field.width <= cols
      ? Math.floor((field.width - cols) / 2)
      : Math.min(field.width - cols, Math.max(0, ideal))

  // The backdrop covers the window plus how far it scrolls, so its middle is in view
  // mid-journey. Offsets snap to whole cells to keep the grid aligned.
  const backdropWidth = cols + Math.ceil(Math.max(0, field.width - cols) * PARALLAX)
  const backdrop = useMemo(
    () => level.backdrop?.(seed, backdropWidth, field.rows) ?? null,
    [level, seed, backdropWidth, field.rows],
  )
  const backdropX = Math.round(cameraX * PARALLAX)

  // How far along the level is: 0 at the start, 1 at the exit, eased in and out. The sky
  // and the shade over the land change with it.
  const journey = Math.min(1, Math.max(0, (x - START_X) / (field.exit - START_X)))
  const progress = journey * journey * (3 - 2 * journey)
  const topColor = level.skyAtExit
    ? `color-mix(in oklch, ${cssColor(level.sky[0])}, ${cssColor(level.skyAtExit[0])} ${progress * 100}%)`
    : cssColor(level.sky[0])

  const shown =
    blink && blinking
      ? step === null
        ? blinking.standing
        : blinking.steps[step]
      : step === null
        ? sprite
        : steps[step]
  // Bob up a pixel on the second step.
  const unicornY = field.rows - altitude - sprite.height - (step === 1 ? 1 : 0)

  return (
    <main
      ref={containerRef}
      className="relative h-dvh overflow-hidden"
      // Matches the top of the sky, for windows taller than the field.
      style={{ backgroundColor: topColor }}
      aria-label="Game"
    >
      {size.height > 0 && <SkyView sky={level.sky} rows={field.rows} cell={cell} />}
      {/* The sky at the exit fades in over the starting one. */}
      {size.height > 0 && level.skyAtExit && progress > 0 && (
        <SkyView sky={level.skyAtExit} rows={field.rows} cell={cell} opacity={progress} />
      )}
      {size.height > 0 && backdrop && (
        <div
          className="absolute bottom-0 left-0"
          style={{ transform: `translateX(${-backdropX * cell}px)` }}
        >
          <BackdropView pixels={backdrop} width={backdropWidth} rows={field.rows} cell={cell} />
        </div>
      )}
      {size.height > 0 && (
        // The field is anchored to the bottom of the window.
        <div
          className="absolute bottom-0 left-0"
          style={{ transform: `translateX(${-cameraX * cell}px)` }}
        >
          <FieldView field={field} cell={cell} />
          <Snails field={field} cell={cell} tick={hornTick} squished={squished} />
          {sprite.width > 0 && !finished && (
            <div className="absolute" style={{ left: x * cell, top: unicornY * cell }}>
              <Unicorn sprite={shown} cell={cell} facing={facing} />
            </div>
          )}
          {/* One overlay draws every grid line, instead of a border on each pixel. */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgb(0 0 0 / 0.12) 1px, transparent 1px), linear-gradient(to bottom, rgb(0 0 0 / 0.12) 1px, transparent 1px)',
              backgroundSize: `${cell}px ${cell}px`,
            }}
          />
        </div>
      )}
      {level.shadeAtExit !== undefined && (
        <div
          className="pointer-events-none absolute inset-0 bg-indigo-950"
          style={{ opacity: progress * level.shadeAtExit }}
        />
      )}
      <button
        type="button"
        aria-label="Edit unicorn"
        title="Edit unicorn"
        className="absolute top-3 left-3 rounded-2xl border-4 border-transparent p-2 transition-transform hover:-rotate-3 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
        style={maneBorderStyle}
        onClick={onEdit}
      >
        {/* A pencil stands in if everything has been erased. */}
        {sprite.width > 0 ? (
          <SpriteIcon sprite={blink && blinking ? blinking.standing : sprite} />
        ) : (
          <PencilIcon />
        )}
      </button>
      {finished ? (
        <div className="absolute inset-0 flex items-center justify-center bg-indigo-950/40">
          <div
            role="dialog"
            aria-labelledby="level-end-title"
            className="flex flex-col items-center gap-4 rounded-2xl border-4 border-transparent px-8 py-6 text-sky-100"
            style={maneBorderStyle}
          >
            <h2 id="level-end-title" className="text-2xl font-semibold text-white">
              {level.exitTitle}
            </h2>
            <div className="flex gap-3">
              <button
                type="button"
                autoFocus
                className="rounded-lg bg-sky-300 px-4 py-2 font-medium text-indigo-950 hover:bg-sky-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
                onClick={onContinue}
              >
                {continueLabel}
              </button>
              <button
                type="button"
                className="rounded-lg px-4 py-2 font-medium hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
                onClick={onEdit}
              >
                Edit unicorn
              </button>
            </div>
          </div>
        </div>
      ) : (
        <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-indigo-950/85 px-4 py-2 text-sky-100">
          {level.hint}
        </p>
      )}
    </main>
  )
}
