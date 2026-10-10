import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { cssColor, type TailwindColor } from '../../drawing/colors'
import type { Drawing } from '../../drawing/types'
import { SNAIL_FRAMES, SNAIL_SQUISHED, SQUISH_SPREAD } from '../../game/snail'
import {
  findEye,
  spriteFromDrawing,
  walkFrames,
  withEyeClosed,
  type Sprite,
} from '../../game/sprite'
import {
  DAY_SKY,
  DUSK_SKY,
  generateBackdrop,
  generateField,
  skyRows,
  type BackdropPixel,
  type Field,
} from '../../game/world'
import { PencilIcon } from '../icons'
import { maneBorderStyle } from '../mane'

const FIELD_WIDTH = 900
const FIELD_ROWS = 96
const MIN_CELL_SIZE = 4
// The backdrop moves at this fraction of the field's speed.
const PARALLAX = 0.35
// Walking speed in cells per second.
const SPEED = 24
// Jump physics in cells and seconds: about 18 cells high and 1.3 s in the air,
// enough to clear a snail with room to spare.
const GRAVITY = 80
const JUMP_SPEED = 54
// Landing on a snail squishes it for SQUISH_FOR ms and bounces the unicorn off, about 9 cells.
const BOUNCE_SPEED = 38
const SQUISH_FOR = 400
// Blink for BLINK_FOR ms once every BLINK_EVERY ms.
const BLINK_EVERY = 3200
const BLINK_FOR = 150
// How long each snail horn pose lasts, in ms.
const HORN_FRAME = 280

type FieldViewProps = { field: Field; cell: number }

// Every pixel of the field as a div. Rendered once; the camera moves it with a transform.
// Open-sky cells are transparent so the backdrop and sky show through.
const FieldView = memo(function FieldView({ field, cell }: FieldViewProps) {
  return (
    <div className="flex">
      {field.columns.map((colors, x) => (
        <div key={x} className="flex shrink-0 flex-col" style={{ width: cell }}>
          {colors.map((color, y) => (
            <div
              key={y}
              style={{
                height: cell,
                backgroundColor: color ? cssColor(color) : undefined,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  )
})

type SkyViewProps = { sky: TailwindColor[]; rows: number; cell: number; opacity?: number }

// The sky never moves: its bands are horizontal, so each row is a single div, and dithered
// rows use a checker pattern of the two band colors.
const SkyView = memo(function SkyView({ sky, rows, cell, opacity }: SkyViewProps) {
  return (
    <div className="absolute inset-x-0 bottom-0" style={{ opacity }}>
      {skyRows(rows, sky).map((row, y) => (
        <div
          key={y}
          style={{
            height: cell,
            backgroundColor: cssColor(row.color),
            backgroundImage: row.dither
              ? `repeating-linear-gradient(to right, ${cssColor(row.dither)} 0 ${cell}px, transparent ${cell}px ${cell * 2}px)`
              : undefined,
            backgroundPosition: y % 2 === 0 ? '0 0' : `${cell}px 0`,
          }}
        />
      ))}
    </div>
  )
})

type BackdropViewProps = {
  pixels: BackdropPixel[]
  width: number
  rows: number
  cell: number
}

// Clouds and the rainbow, one div per pixel. Scrolls slower than the field for parallax.
const BackdropView = memo(function BackdropView({ pixels, width, rows, cell }: BackdropViewProps) {
  return (
    <div className="relative" style={{ width: width * cell, height: rows * cell }}>
      {pixels.map((p) => (
        <div
          key={`${p.x},${p.y}`}
          className="absolute"
          style={{
            left: p.x * cell,
            top: p.y * cell,
            width: cell,
            height: cell,
            backgroundColor: cssColor(p.color),
          }}
        />
      ))}
    </div>
  )
})

type SnailProps = { pixels: Map<string, TailwindColor>; left: number; bottom: number; cell: number }

// One snail as pixel divs. `bottom` is the row its foot sits on; keys are "x,u", u upward.
const Snail = memo(function Snail({ pixels, left, bottom, cell }: SnailProps) {
  return [...pixels].map(([key, color]) => {
    const [x, u] = key.split(',').map(Number)
    return (
      <div
        key={key}
        className="absolute"
        style={{
          left: (left + x) * cell,
          top: (bottom - u) * cell,
          width: cell,
          height: cell,
          backgroundColor: cssColor(color),
        }}
      />
    )
  })
})

type SnailsProps = { field: Field; cell: number; tick: number; squished: number[] }

// The snails, drawn over the field since they move: their horns wiggle, each snail a few
// frames out of step with the one before, and they flatten for a moment when jumped on.
const Snails = memo(function Snails({ field, cell, tick, squished }: SnailsProps) {
  return field.snails.map((snail, i) => {
    const bottom = field.rows - snail.ground - 1
    return squished.includes(i) ? (
      <Snail
        key={i}
        pixels={SNAIL_SQUISHED}
        left={snail.left - SQUISH_SPREAD}
        bottom={bottom}
        cell={cell}
      />
    ) : (
      <Snail
        key={i}
        pixels={SNAIL_FRAMES[(tick + i * 2) % SNAIL_FRAMES.length]}
        left={snail.left}
        bottom={bottom}
        cell={cell}
      />
    )
  })
})

type UnicornProps = { sprite: Sprite; cell: number; facing: 1 | -1 }

const Unicorn = memo(function Unicorn({ sprite, cell, facing }: UnicornProps) {
  return (
    <div
      className="relative"
      // The drawing faces right; mirror it when walking left.
      style={{
        width: sprite.width * cell,
        height: sprite.height * cell,
        transform: `scaleX(${facing})`,
      }}
    >
      {sprite.pixels.map((p) => (
        <div
          key={`${p.x},${p.y}`}
          className="absolute"
          style={{
            left: p.x * cell,
            top: p.y * cell,
            width: cell,
            height: cell,
            backgroundColor: cssColor(p.color),
          }}
        />
      ))}
    </div>
  )
})

// The unicorn drawn small as an SVG, for the button that opens the editor.
function SpriteIcon({ sprite }: { sprite: Sprite }) {
  return (
    <svg
      className="h-12 w-auto"
      viewBox={`0 0 ${sprite.width} ${sprite.height}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {sprite.pixels.map((p) => (
        <rect
          key={`${p.x},${p.y}`}
          x={p.x}
          y={p.y}
          width={1}
          height={1}
          style={{ fill: cssColor(p.color) }}
        />
      ))}
    </svg>
  )
}

type GameProps = {
  drawing: Drawing
  // While true (the editor is open) the game ignores the keyboard and stands still.
  paused: boolean
  onEdit: () => void
}

// Each run gets its own field; "Play again" remounts the run with a new key.
export function Game(props: GameProps) {
  const [run, setRun] = useState(0)
  return <GameRun key={run} {...props} onRestart={() => setRun((r) => r + 1)} />
}

type GameRunProps = GameProps & { onRestart: () => void }

// Where the unicorn starts, in cells from the field's left edge.
const START_X = 8

function GameRun({ drawing, paused, onEdit, onRestart }: GameRunProps) {
  const containerRef = useRef<HTMLElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  // Generated once per game, with a fresh random seed.
  const [seed] = useState(() => Math.floor(Math.random() * 2 ** 31))
  const [field] = useState(() => generateField(seed, FIELD_WIDTH, FIELD_ROWS))
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

  // The unicorn's left edge in whole cells, and its pose. React only re-renders
  // when one of these changes, a few times a second while walking.
  const maxX = Math.max(0, field.width - sprite.width)
  const [unicornX, setUnicornX] = useState(START_X)
  const [facing, setFacing] = useState<1 | -1>(1)
  // Walk cycle: null while standing, otherwise which of the two steps is showing.
  const [step, setStep] = useState<0 | 1 | null>(null)
  // Height of the unicorn's hooves above the field's bottom, in whole cells.
  const [altitude, setAltitude] = useState(0)
  const [blink, setBlink] = useState(false)
  const [hornTick, setHornTick] = useState(0)
  // Indexes of the snails that are squished right now.
  const [squished, setSquished] = useState<number[]>([])
  // Set once the unicorn walks into the castle; the run is over.
  const [won, setWon] = useState(false)

  // Read by the game loop without restarting it when the editor opens or closes.
  const pausedRef = useRef(paused)
  useEffect(() => {
    pausedRef.current = paused
  }, [paused])
  // Where the unicorn is, kept across loop restarts: editing the unicorn restarts the loop
  // with the new sprite, and it should carry on from the same spot.
  const placeRef = useRef<{ position: number; facing: 1 | -1 }>({
    position: START_X,
    facing: 1,
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

  // Game loop: read input, run walking, jumping and collisions, and publish whole-cell
  // changes to React.
  useEffect(() => {
    const held = new Set<string>()
    let jumpQueued = false
    let { position, facing } = placeRef.current
    // The edited unicorn may be wider and no longer fit at the field's end.
    position = Math.min(position, maxX)
    let vy = 0
    let grounded = true
    let finished = false
    let last = performance.now()
    let frame = 0
    // When each snail springs back after being squished, in performance.now() time.
    const squishedUntil = field.snails.map(() => 0)
    let squishedKey = ''

    // Hooves are the bottom row of a frame; mirror their columns when facing left.
    function hooves(shown: Sprite, x: number, facingNow: 1 | -1) {
      return shown.pixels
        .filter((p) => p.y === shown.height - 1)
        .map((p) => Math.floor(x) + (facingNow === 1 ? p.x : sprite.width - 1 - p.x))
    }
    function overlapsSnail(columns: number[], snail: Field['snails'][number]) {
      return columns.some((c) => c >= snail.left && c < snail.right)
    }
    // Every column a hoof can occupy in any walking frame. Snail collisions use this, so
    // a mid-step hoof can't poke into a shell that the blocking check didn't see.
    function footprint(x: number, facingNow: 1 | -1) {
      const columns = [sprite, ...steps].flatMap((shown) => hooves(shown, x, facingNow))
      return [...new Set(columns)]
    }
    // What the unicorn stands on: terrain under the hooves being shown, or a snail's shell.
    function floorUnder(x: number, shown: Sprite, facingNow: 1 | -1) {
      let floor = 0
      for (const c of hooves(shown, x, facingNow)) floor = Math.max(floor, field.heights[c] ?? 0)
      const feet = footprint(x, facingNow)
      for (const snail of field.snails) {
        if (overlapsSnail(feet, snail)) floor = Math.max(floor, snail.top)
      }
      return floor
    }

    let altitude = floorUnder(position, sprite, facing)

    function handleKeyDown(event: KeyboardEvent) {
      // Leave keys alone for the editor while it's open.
      if (pausedRef.current) return
      if (event.code === 'Space') {
        // Also stops Space from pressing a focused button.
        event.preventDefault()
        if (!event.repeat) jumpQueued = true
        return
      }
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
      event.preventDefault()
      held.add(event.key)
    }
    function handleKeyUp(event: KeyboardEvent) {
      if (event.code === 'Space') event.preventDefault()
      held.delete(event.key)
    }
    // Keys released while the window is unfocused would otherwise stay held.
    function handleBlur() {
      held.clear()
    }

    function tick(now: number) {
      if (finished) return
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now
      if (pausedRef.current) {
        held.clear()
        jumpQueued = false
      }
      const direction = (held.has('ArrowRight') ? 1 : 0) - (held.has('ArrowLeft') ? 1 : 0)

      if (direction !== 0) {
        facing = direction > 0 ? 1 : -1
        const next = Math.min(maxX, Math.max(0, position + direction * SPEED * dt))
        const here = footprint(position, facing)
        const there = footprint(next, facing)
        // A snail blocks the way unless the hooves are already above its shell.
        const blocked = field.snails.some(
          (snail) =>
            overlapsSnail(there, snail) && !overlapsSnail(here, snail) && altitude < snail.top,
        )
        if (!blocked) position = next
      }

      if (jumpQueued && grounded) {
        vy = JUMP_SPEED
        grounded = false
      }
      jumpQueued = false

      // Legs spread mid-air; alternate steps while walking on the ground.
      const step: 0 | 1 | null = !grounded
        ? 0
        : direction === 0
          ? null
          : Math.floor(now / 120) % 2 === 0
            ? 0
            : 1
      const floor = floorUnder(position, step === null ? sprite : steps[step], facing)

      if (!grounded) {
        vy -= GRAVITY * dt
        altitude += vy * dt
        if (altitude <= floor && vy <= 0) {
          altitude = floor
          vy = 0
          grounded = true
          // Landed on a shell: squish the snail and bounce off it.
          const feet = footprint(position, facing)
          field.snails.forEach((snail, i) => {
            if (snail.top !== floor || !overlapsSnail(feet, snail)) return
            squishedUntil[i] = now + SQUISH_FOR
            vy = BOUNCE_SPEED
            grounded = false
          })
        }
      } else if (floor < altitude - 1) {
        // Walked off a snail or a ledge: fall.
        grounded = false
        vy = 0
      } else {
        altitude = floor
      }

      placeRef.current = { position, facing }
      setFacing(facing)
      setUnicornX(Math.floor(position))
      setAltitude(Math.round(altitude))
      setStep(step)
      // A quick blink every few seconds.
      setBlink(now % BLINK_EVERY < BLINK_FOR)
      setHornTick(Math.floor(now / HORN_FRAME))
      // Publish a new array only when the set changes, so the snails don't re-render.
      const squishedNow = squishedUntil.flatMap((until, i) => (now < until ? [i] : []))
      if (squishedNow.join() !== squishedKey) {
        squishedKey = squishedNow.join()
        setSquished(squishedNow)
      }
      // Inside once the unicorn's left edge is through the doorway.
      if (position >= field.door.left) {
        finished = true
        setStep(null)
        setWon(true)
        return
      }
      frame = requestAnimationFrame(tick)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', handleBlur)
    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', handleBlur)
    }
  }, [maxX, field, sprite, steps])

  // Round up so the field always fills the window's height; only the top rows of sky are cut off.
  const cell = Math.max(MIN_CELL_SIZE, Math.ceil(size.height / FIELD_ROWS))
  const cols = Math.floor(size.width / cell)
  // Follow the unicorn, but stop at the field's ends (or center a field narrower than the window).
  const ideal = unicornX + Math.floor(sprite.width / 2) - Math.floor(cols / 2)
  const cameraX =
    field.width <= cols
      ? Math.floor((field.width - cols) / 2)
      : Math.min(field.width - cols, Math.max(0, ideal))

  // The backdrop covers the window plus how far it scrolls, with the rainbow in the middle
  // of that, so it's in view mid-journey. Offsets snap to whole cells to keep the grid aligned.
  const backdropWidth = cols + Math.ceil(Math.max(0, field.width - cols) * PARALLAX)
  const backdrop = useMemo(
    () => generateBackdrop(seed, backdropWidth, field.rows),
    [seed, backdropWidth, field.rows],
  )
  const backdropX = Math.round(cameraX * PARALLAX)

  // Evening falls on the way: 0 at the start, 1 at the castle door, eased in and out.
  const journey = Math.min(1, Math.max(0, (unicornX - START_X) / (field.door.left - START_X)))
  const dusk = journey * journey * (3 - 2 * journey)

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
      style={{
        backgroundColor: `color-mix(in oklch, ${cssColor(DAY_SKY[0])}, ${cssColor(DUSK_SKY[0])} ${dusk * 100}%)`,
      }}
      aria-label="Game"
    >
      {size.height > 0 && <SkyView sky={DAY_SKY} rows={field.rows} cell={cell} />}
      {/* The evening sky fades in over the day sky as the unicorn nears the castle. */}
      {size.height > 0 && dusk > 0 && (
        <SkyView sky={DUSK_SKY} rows={field.rows} cell={cell} opacity={dusk} />
      )}
      {size.height > 0 && (
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
          {sprite.width > 0 && !won && (
            <div className="absolute" style={{ left: unicornX * cell, top: unicornY * cell }}>
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
      {/* The land darkens a little too as the day ends. */}
      <div
        className="pointer-events-none absolute inset-0 bg-indigo-950"
        style={{ opacity: dusk * 0.25 }}
      />
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
      {won ? (
        <div className="absolute inset-0 flex items-center justify-center bg-indigo-950/40">
          <div
            role="dialog"
            aria-labelledby="game-over-title"
            className="flex flex-col items-center gap-4 rounded-2xl border-4 border-transparent px-8 py-6 text-sky-100"
            style={maneBorderStyle}
          >
            <h2 id="game-over-title" className="text-2xl font-semibold text-white">
              You made it to the castle!
            </h2>
            <div className="flex gap-3">
              <button
                type="button"
                autoFocus
                className="rounded-lg bg-sky-300 px-4 py-2 font-medium text-indigo-950 hover:bg-sky-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
                onClick={onRestart}
              >
                Play again
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
          Walk to the castle with ← and →, and jump over snails with Space.
        </p>
      )}
    </main>
  )
}
