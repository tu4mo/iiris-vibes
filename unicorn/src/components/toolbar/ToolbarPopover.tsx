import type { ReactNode } from 'react'
import type { Drawing } from '../../drawing/types'
import { PixelArt } from '../PixelArt'
import type { useAnchoredPopover } from './useAnchoredPopover'

type ToolbarPopoverProps = {
  popoverProps: ReturnType<typeof useAnchoredPopover>['popoverProps']
  label: string
  children: ReactNode
}

// The panel a toolbar button opens, styled to match the toolbar.
export function ToolbarPopover({ popoverProps, label, children }: ToolbarPopoverProps) {
  return (
    <div
      {...popoverProps}
      aria-label={label}
      className="fixed inset-auto m-0 p-1.5 max-h-[calc(100dvh-16px)] overflow-y-auto rounded-xl border border-white/10 bg-indigo-950 text-sky-100 shadow-[6px_6px_0_rgb(30_27_75/0.25)]"
    >
      {children}
    </div>
  )
}

type PopoverOptionProps = {
  selected: boolean
  onClick: () => void
  children: ReactNode
}

// A row in a popover list: a preview followed by its name.
export function PopoverOption({ selected, onClick, children }: PopoverOptionProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className="flex items-center gap-3 rounded-lg py-1.5 pr-4 pl-1.5 text-left hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-amber-300 aria-pressed:bg-white/15 aria-pressed:text-white"
      onClick={onClick}
    >
      {children}
    </button>
  )
}

// The whole picture as it would look with an option applied, for an option's preview.
export function DrawingPreview({ drawing }: { drawing: Drawing }) {
  return (
    <span className="flex size-16 items-center justify-center rounded-md bg-white p-1 ring-1 ring-white/20">
      <PixelArt drawing={drawing} className="size-full" />
    </span>
  )
}
