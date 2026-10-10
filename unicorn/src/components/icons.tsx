import { useId, type ReactNode } from 'react'
import { cssColor, type TailwindColor } from '../drawing/colors'

// 24px stroke icons; paths from Lucide (ISC license).
function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      className="size-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

// Gradient ids must be unique per icon instance, and useId's characters break url(#...).
function useGradientId() {
  return `gradient-${useId().replace(/[^\w-]/g, '')}`
}

type Stop = { offset: number; color: TailwindColor }

// A gradient running between two points in the 24x24 icon space.
function Gradient({ id, from, to, stops }: { id: string; from: [number, number]; to: [number, number]; stops: Stop[] }) {
  return (
    <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]}>
      {stops.map((stop, i) => (
        <stop key={i} offset={stop.offset} style={{ stopColor: cssColor(stop.color) }} />
      ))}
    </linearGradient>
  )
}

// The pencil body is filled with a rainbow running from the tip to the end.
export function PencilIcon() {
  const id = useGradientId()
  return (
    <Icon>
      <defs>
        <Gradient
          id={id}
          from={[3, 21]}
          to={[21, 3]}
          stops={[
            { offset: 0.15, color: 'rose-400' },
            { offset: 0.35, color: 'amber-300' },
            { offset: 0.55, color: 'green-300' },
            { offset: 0.75, color: 'sky-300' },
            { offset: 0.95, color: 'violet-400' },
          ]}
        />
      </defs>
      <path
        fill={`url(#${id})`}
        d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"
      />
      <path d="m15 5 4 4" />
    </Icon>
  )
}

// A two-tone eraser: a sky-blue end, then a rose-to-violet body. The gradient runs
// across the dividing line (x - y = -6), with a hard stop exactly on it at 25%.
export function EraserIcon() {
  const id = useGradientId()
  return (
    <Icon>
      <defs>
        <Gradient
          id={id}
          from={[0, 12]}
          to={[12, 0]}
          stops={[
            { offset: 0.25, color: 'sky-300' },
            { offset: 0.25, color: 'rose-300' },
            { offset: 0.8, color: 'violet-400' },
          ]}
        />
      </defs>
      <path
        fill={`url(#${id})`}
        d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"
      />
      <path d="M22 21H7" />
      <path d="m5 11 9 9" />
    </Icon>
  )
}

// An eyedropper with its bulb filled amber to rose, like the pencil and eraser.
export function PipetteIcon() {
  const id = useGradientId()
  return (
    <Icon>
      <defs>
        <Gradient
          id={id}
          from={[12, 12]}
          to={[22, 2]}
          stops={[
            { offset: 0.2, color: 'amber-300' },
            { offset: 0.9, color: 'rose-400' },
          ]}
        />
      </defs>
      <path d="m2 22 1-1h3l9-9" />
      <path d="M3 21v-3l9-9" />
      <path
        fill={`url(#${id})`}
        d="m15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9l.4.4a2.1 2.1 0 1 1-3 3l-3.8-3.8a2.1 2.1 0 1 1 3-3l.4.4Z"
      />
    </Icon>
  )
}

// A play triangle filled with a rainbow, top to bottom.
export function PlayIcon() {
  const id = useGradientId()
  return (
    <Icon>
      <defs>
        <Gradient
          id={id}
          from={[12, 3]}
          to={[12, 21]}
          stops={[
            { offset: 0.1, color: 'rose-400' },
            { offset: 0.35, color: 'amber-300' },
            { offset: 0.6, color: 'green-300' },
            { offset: 0.9, color: 'sky-300' },
          ]}
        />
      </defs>
      <polygon fill={`url(#${id})`} points="6 3 20 12 6 21 6 3" />
    </Icon>
  )
}

export function ResetIcon() {
  return (
    <Icon>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </Icon>
  )
}
