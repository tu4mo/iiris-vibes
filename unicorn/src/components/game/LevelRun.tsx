import { useEffect, useEffectEvent, useMemo, useState } from 'react'
import { cssColor } from '../../drawing/colors'
import type { Drawing } from '../../drawing/types'
import { DRESS_STYLES, wearDress } from '../../game/sprites/dress'
import type { Level } from '../../game/levels'
import { clamp, smoothstep } from '../../game/math'
import { spriteFromDrawing, walkFrames, type Sprite } from '../../game/sprites/unicorn'
import { withEyeClosed } from '../../presets/defaultDrawing'
import { MusicOffIcon, MusicOnIcon, PencilIcon } from '../icons'
import { START_X, usePlayLoop } from './usePlayLoop'
import { maneBorderStyle } from '../mane'
import { useSize } from './useSize'
import {
  BackdropView,
  FieldView,
  PickupTally,
  Pickups,
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
  // The dress style the unicorn comes into the level wearing, if any.
  dress: number | null
  // Called once the unicorn reaches the field's exit, with the dress it's wearing then.
  onExit: (dress: number | null) => void
  // Fade in from black, as if coming through a door.
  fadeIn: boolean
  muted: boolean
  onToggleMuted: () => void
}

// The color above the field, for windows taller than it: the ceiling indoors, or the top
// of the sky, fading toward the exit's sky as the level goes on.
function topColor(scenery: Level['scenery'], progress: number) {
  if (scenery.kind === 'indoors') return cssColor(scenery.wall.ceiling)
  const start = cssColor(scenery.sky[0])
  if (!scenery.skyAtExit) return start
  return `color-mix(in oklch, ${start}, ${cssColor(scenery.skyAtExit[0])} ${progress * 100}%)`
}

// One play of a level, on a field generated for it. Remounted (with a new key) to play
// the level again or move on to another.
export function LevelRun({
  level,
  drawing,
  paused,
  onEdit,
  dress,
  onExit,
  fadeIn,
  muted,
  onToggleMuted,
}: LevelRunProps) {
  const [containerRef, size] = useSize<HTMLElement>()
  // Generated once per run, with a fresh random seed.
  const [seed] = useState(() => Math.floor(Math.random() * 2 ** 31))
  const [field] = useState(() => level.generate(seed))
  const sprite = useMemo(() => spriteFromDrawing(drawing), [drawing])
  // The same unicorn with its eye closed, switched in for blinking.
  const blinkSprite = useMemo(() => spriteFromDrawing(withEyeClosed(drawing)), [drawing])
  // The physics only needs the shape, which a dress doesn't change.
  const steps = useMemo(() => walkFrames(sprite), [sprite])

  const { x, facing, step, altitude, blink, hornTick, squished, collected, finished } = usePlayLoop(
    { field, sprite, steps, paused },
  )

  // The unicorn wears the dress it picked up last, or the one it came in wearing.
  const wornStyle =
    collected.map((i) => field.pickups[i]).findLast((p) => p.kind === 'dress')?.style ?? dress
  const looks = useMemo(() => {
    // Standing and the two steps, wearing the dress.
    function poses(unicorn: Sprite) {
      const worn = wornStyle === null ? unicorn : wearDress(unicorn, DRESS_STYLES[wornStyle])
      return { standing: worn, steps: walkFrames(worn) }
    }
    return { open: poses(sprite), blinking: poses(blinkSprite) }
  }, [sprite, blinkSprite, wornStyle])

  const handleExit = useEffectEvent(() => onExit(wornStyle))
  useEffect(() => {
    if (finished) handleExit()
  }, [finished])

  // Round up so the field always fills the window's height; only the top rows of sky are cut off.
  const cell = Math.max(MIN_CELL_SIZE, Math.ceil(size.height / field.rows))
  const cols = Math.floor(size.width / cell)
  // Follow the unicorn, but stop at the field's ends (or center a field narrower than the window).
  const ideal = x + Math.floor(sprite.width / 2) - Math.floor(cols / 2)
  const cameraX =
    field.width <= cols ? Math.floor((field.width - cols) / 2) : clamp(ideal, 0, field.width - cols)

  // The backdrop covers the window plus how far it scrolls, so its middle is in view
  // mid-journey. Offsets snap to whole cells to keep the grid aligned.
  const backdropWidth = cols + Math.ceil(Math.max(0, field.width - cols) * PARALLAX)
  const { scenery } = level
  const outdoors = scenery.kind === 'outdoors' ? scenery : null
  const indoors = scenery.kind === 'indoors' ? scenery : null
  const backdrop = useMemo(
    () => outdoors?.backdrop?.(seed, backdropWidth, field.rows) ?? null,
    [outdoors, seed, backdropWidth, field.rows],
  )
  const backdropX = Math.round(cameraX * PARALLAX)

  // How far along the level is: 0 at the start, 1 at the exit, eased in and out. Outdoors,
  // the sky and the shade over the land change with it.
  const progress = smoothstep(clamp((x - START_X) / (field.exit - START_X), 0, 1))

  const poses = blink ? looks.blinking : looks.open
  const shown = step === null ? poses.standing : poses.steps[step]
  // Bob up a pixel on the second step.
  const unicornY = field.rows - altitude - sprite.height - (step === 1 ? 1 : 0)

  return (
    <main
      ref={containerRef}
      className="relative h-dvh overflow-hidden"
      style={{ backgroundColor: topColor(scenery, progress) }}
      aria-label="Game"
    >
      {/* Nothing is drawn until the window has been measured. */}
      {size.height > 0 && (
        <>
          {outdoors && <SkyView sky={outdoors.sky} rows={field.rows} cell={cell} />}
          {/* The sky at the exit fades in over the starting one. */}
          {outdoors?.skyAtExit && progress > 0 && (
            <SkyView sky={outdoors.skyAtExit} rows={field.rows} cell={cell} opacity={progress} />
          )}
          {backdrop && (
            <div
              className="absolute bottom-0 left-0"
              style={{ transform: `translateX(${-backdropX * cell}px)` }}
            >
              <BackdropView pixels={backdrop} width={backdropWidth} rows={field.rows} cell={cell} />
            </div>
          )}
          {/* The field is anchored to the bottom of the window. */}
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
            <Pickups field={field} cell={cell} spriteHeight={sprite.height} collected={collected} />
            {sprite.width > 0 && !finished && (
              <div className="absolute" style={{ left: x * cell, top: unicornY * cell }}>
                <Unicorn sprite={shown} cell={cell} facing={facing} />
              </div>
            )}
          </div>
        </>
      )}
      {outdoors?.shadeAtExit !== undefined && (
        <div
          className="pointer-events-none absolute inset-0 bg-indigo-950"
          style={{ opacity: progress * outdoors.shadeAtExit }}
        />
      )}
      <PickupTally pickups={field.pickups} collected={collected} />
      <div className="absolute top-3 left-3 flex items-start gap-3">
        <button
          type="button"
          aria-label="Edit unicorn"
          title="Edit unicorn"
          className="rounded-2xl border-4 border-transparent p-2 transition-transform hover:-rotate-3 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
          style={maneBorderStyle}
          onClick={onEdit}
        >
          {/* A pencil stands in if everything has been erased. */}
          {sprite.width > 0 ? <SpriteIcon sprite={poses.standing} /> : <PencilIcon />}
        </button>
        <button
          type="button"
          aria-label="Sound"
          aria-pressed={!muted}
          title={muted ? 'Turn sound on' : 'Turn sound off'}
          className="rounded-2xl bg-indigo-950/85 p-3 text-sky-100 transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
          // Clicking would otherwise leave it focused, and Space (jump) would press it again.
          onPointerDown={(event) => event.preventDefault()}
          onClick={onToggleMuted}
        >
          {muted ? <MusicOffIcon /> : <MusicOnIcon />}
        </button>
      </div>
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
