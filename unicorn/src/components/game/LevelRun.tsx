import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
import { cssColor } from '../../drawing/colors'
import type { Drawing } from '../../drawing/types'
import { DRESS_SHAPES, DRESS_STYLES, wearDress } from '../../game/dress'
import type { Level } from '../../game/levels'
import { findEye, spriteFromDrawing, walkFrames, withEyeClosed } from '../../game/sprite'
import { PencilIcon } from '../icons'
import { START_X, usePlayLoop } from './usePlayLoop'
import { maneBorderStyle } from '../mane'
import {
  BackdropView,
  Dresses,
  FieldView,
  Snails,
  SkyView,
  SpriteIcon,
  Unicorn,
  WallView,
} from './views'

const MIN_CELL_SIZE = 4
// The backdrop moves at this fraction of the field's speed.
const PARALLAX = 0.35

type LevelRunProps = {
  level: Level
  drawing: Drawing
  // While true (the editor is open) the game ignores the keyboard and stands still.
  paused: boolean
  onEdit: () => void
  // Called once the unicorn reaches the field's exit.
  onExit: () => void
  // Fade in from black, as if coming through a door.
  fadeIn: boolean
}

// One play of a level, on a field generated for it. Remounted (with a new key) to play
// the level again or move on to another.
export function LevelRun({ level, drawing, paused, onEdit, onExit, fadeIn }: LevelRunProps) {
  const containerRef = useRef<HTMLElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  // Generated once per run, with a fresh random seed.
  const [seed] = useState(() => Math.floor(Math.random() * 2 ** 31))
  const [field] = useState(() => level.generate(seed))
  const sprite = useMemo(() => spriteFromDrawing(drawing), [drawing])
  // The physics only needs the shape, which a dress doesn't change.
  const steps = useMemo(() => walkFrames(sprite), [sprite])

  const { x, facing, step, altitude, blink, hornTick, squished, collected, finished } = usePlayLoop(
    { field, sprite, steps, paused },
  )

  // The unicorn wears the dress it picked up last.
  const wornStyle = collected.length > 0 ? field.dresses[collected.at(-1)!].style : null
  const looks = useMemo(() => {
    const worn = wornStyle === null ? sprite : wearDress(sprite, DRESS_STYLES[wornStyle])
    const wornSteps = wornStyle === null ? steps : walkFrames(worn)
    // The same three poses with the eye closed, for blinking. Null if no eye was found.
    const eye = findEye(worn)
    const blinking = eye && {
      standing: withEyeClosed(worn, eye),
      steps: wornSteps.map((f) => withEyeClosed(f, eye)),
    }
    return { standing: worn, steps: wornSteps, blinking }
  }, [sprite, steps, wornStyle])

  const handleExit = useEffectEvent(onExit)
  useEffect(() => {
    if (finished) handleExit()
  }, [finished])

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
  const outdoors = level.scenery.kind === 'outdoors' ? level.scenery : null
  const indoors = level.scenery.kind === 'indoors' ? level.scenery : null
  const backdrop = useMemo(
    () => outdoors?.backdrop?.(seed, backdropWidth, field.rows) ?? null,
    [outdoors, seed, backdropWidth, field.rows],
  )
  const backdropX = Math.round(cameraX * PARALLAX)

  // How far along the level is: 0 at the start, 1 at the exit, eased in and out. Outdoors,
  // the sky and the shade over the land change with it.
  const journey = Math.min(1, Math.max(0, (x - START_X) / (field.exit - START_X)))
  const progress = journey * journey * (3 - 2 * journey)
  // The color above the field, for windows taller than it.
  const topColor = !outdoors
    ? cssColor(indoors!.wall.ceiling)
    : outdoors.skyAtExit
      ? `color-mix(in oklch, ${cssColor(outdoors.sky[0])}, ${cssColor(outdoors.skyAtExit[0])} ${progress * 100}%)`
      : cssColor(outdoors.sky[0])

  const poses = blink && looks.blinking ? looks.blinking : looks
  const shown = step === null ? poses.standing : poses.steps[step]
  // Bob up a pixel on the second step.
  const unicornY = field.rows - altitude - sprite.height - (step === 1 ? 1 : 0)

  return (
    <main
      ref={containerRef}
      className="relative h-dvh overflow-hidden"
      style={{ backgroundColor: topColor }}
      aria-label="Game"
    >
      {size.height > 0 && outdoors && <SkyView sky={outdoors.sky} rows={field.rows} cell={cell} />}
      {/* The sky at the exit fades in over the starting one. */}
      {size.height > 0 && outdoors?.skyAtExit && progress > 0 && (
        <SkyView sky={outdoors.skyAtExit} rows={field.rows} cell={cell} opacity={progress} />
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
          {indoors && (
            <WallView
              wall={indoors.wall}
              seed={seed}
              width={field.width}
              rows={field.rows}
              cell={cell}
            />
          )}
          <FieldView field={field} cell={cell} />
          <Snails field={field} cell={cell} tick={hornTick} squished={squished} />
          <Dresses field={field} cell={cell} spriteHeight={sprite.height} collected={collected} />
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
      {outdoors?.shadeAtExit !== undefined && (
        <div
          className="pointer-events-none absolute inset-0 bg-indigo-950"
          style={{ opacity: progress * outdoors.shadeAtExit }}
        />
      )}
      {field.dresses.length > 0 && (
        <div
          className="absolute top-3 right-3 flex gap-2 rounded-2xl bg-indigo-950/85 p-3"
          role="status"
          aria-label={`Dresses: ${collected.length} of ${field.dresses.length}`}
        >
          {field.dresses.map((dress, i) => (
            <div key={i} className={collected.includes(i) ? '' : 'opacity-40 grayscale'}>
              <SpriteIcon sprite={DRESS_SHAPES[dress.style]} className="h-8" />
            </div>
          ))}
        </div>
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
        {sprite.width > 0 ? <SpriteIcon sprite={poses.standing} /> : <PencilIcon />}
      </button>
      {!finished && (
        <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-indigo-950/85 px-4 py-2 text-sky-100">
          {level.hint}
        </p>
      )}
      {fadeIn && (
        <div className="pointer-events-none absolute inset-0 animate-[fade-out_800ms_ease-in_forwards] bg-black" />
      )}
    </main>
  )
}
