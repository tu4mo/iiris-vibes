import { useEffect, useRef, useState } from 'react'
import { music } from '../../audio/music'
import type { Field, FieldSnail } from '../../game/field'
import { pickupBottom, pickupShape } from '../../game/pickup'
import type { Sprite } from '../../game/sprite'

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

// Where the unicorn starts, in cells from the field's left edge.
export const START_X = 8

type PlayLoopOptions = {
  field: Field
  sprite: Sprite
  // The two walking frames of `sprite`.
  steps: Sprite[]
  // While true (the editor is open) the loop ignores the keyboard and stands still.
  paused: boolean
}

// Plays one level: reads the keyboard, runs walking, jumping, snail collisions and picking
// things up, with their sound effects, and
// publishes whole-cell changes to React, a few times a second while walking.
export function usePlayLoop({ field, sprite, steps, paused }: PlayLoopOptions) {
  const maxX = Math.max(0, field.width - sprite.width)
  // The unicorn's left edge in whole cells.
  const [x, setX] = useState(START_X)
  const [facing, setFacing] = useState<1 | -1>(1)
  // Walk cycle: null while standing, otherwise which of the two steps is showing.
  const [step, setStep] = useState<0 | 1 | null>(null)
  // Height of the unicorn's hooves above the field's bottom, in whole cells.
  const [altitude, setAltitude] = useState(0)
  const [blink, setBlink] = useState(false)
  const [hornTick, setHornTick] = useState(0)
  // Indexes of the snails that are squished right now.
  const [squished, setSquished] = useState<number[]>([])
  // Indexes of the pickups collected so far, in the order they were collected.
  const [collected, setCollected] = useState<number[]>([])
  // Set once the unicorn reaches the field's exit; the level is over.
  const [finished, setFinished] = useState(false)

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
  // Also kept across loop restarts, so nothing is picked up twice.
  const collectedRef = useRef<number[]>([])

  useEffect(() => {
    const held = new Set<string>()
    let jumpQueued = false
    let { position, facing } = placeRef.current
    // The edited unicorn may be wider and no longer fit at the field's end.
    position = Math.min(position, maxX)
    let vy = 0
    let grounded = true
    let done = false
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
    function overlapsSnail(columns: number[], snail: FieldSnail) {
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
      if (done) return
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
        music.effect('jump')
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
          if (!grounded) music.effect('stomp')
        }
      } else if (floor < altitude - 1) {
        // Walked off a snail or a ledge: fall.
        grounded = false
        vy = 0
      } else {
        altitude = floor
      }

      // Pick up anything the unicorn's body touches.
      const left = Math.floor(position)
      const touched = field.pickups.flatMap((pickup, i) => {
        if (collectedRef.current.includes(i)) return []
        const bottom = pickupBottom(pickup, sprite.height)
        const across = left < pickup.right && left + sprite.width > pickup.left
        const level =
          altitude + sprite.height > bottom && altitude < bottom + pickupShape(pickup).height
        return across && level && sprite.width > 0 ? [i] : []
      })
      if (touched.length > 0) {
        collectedRef.current = [...collectedRef.current, ...touched]
        setCollected(collectedRef.current)
        for (const kind of new Set(touched.map((i) => field.pickups[i].kind))) music.effect(kind)
      }

      placeRef.current = { position, facing }
      setFacing(facing)
      setX(Math.floor(position))
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
      // Done once the unicorn's left edge is past the exit.
      if (position >= field.exit) {
        done = true
        setStep(null)
        setFinished(true)
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

  return { x, facing, step, altitude, blink, hornTick, squished, collected, finished }
}
