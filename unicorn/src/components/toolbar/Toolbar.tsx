import type { ReactNode } from 'react'
import { maneDividerStyle, maneEdgeStyle } from '../mane'

export function Toolbar({ children }: { children?: ReactNode }) {
  return (
    <aside
      // A plain column; the rainbow edge on the right separates it from the palette.
      className="box-content flex min-h-0 w-16 flex-col overflow-y-auto border-r-4 bg-indigo-950"
      style={maneEdgeStyle}
      aria-label="Toolbar"
    >
      {children}
    </aside>
  )
}

type ToolbarGroupProps = {
  // Read by screen readers; the divider shows the grouping visually.
  label: string
  // Push the group to the bottom of the toolbar.
  end?: boolean
  children: ReactNode
}

// A set of related buttons, separated from the group above by a divider.
export function ToolbarGroup({ label, end = false, children }: ToolbarGroupProps) {
  return (
    <div
      role="group"
      aria-label={label}
      className={`flex flex-col [&:not(:first-child)]:before:mx-3 [&:not(:first-child)]:before:my-2 [&:not(:first-child)]:before:h-1 [&:not(:first-child)]:before:rounded-full [&:not(:first-child)]:before:bg-(image:--divider) [&:not(:first-child)]:before:content-[''] ${end ? 'mt-auto' : ''}`}
      style={maneDividerStyle}
    >
      {children}
    </div>
  )
}
