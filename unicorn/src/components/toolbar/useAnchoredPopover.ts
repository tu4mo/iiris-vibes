import { useId, useRef, useState, type ToggleEvent } from 'react'

// A popover opened from a toolbar button and placed to its right.
// Popovers render in the top layer, so the toolbar's overflow can't clip them,
// but that also means they have to be positioned by hand.
export function useAnchoredPopover() {
  const popoverId = useId()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  function position() {
    const button = buttonRef.current
    const popover = popoverRef.current
    if (!button || !popover) return
    const rect = button.getBoundingClientRect()
    popover.style.left = `${rect.right + 8}px`
    popover.style.top = `${rect.top}px`
  }

  function hide() {
    popoverRef.current?.hidePopover()
  }

  return {
    // Whether the popover is showing, so its contents can be left unrendered while it isn't.
    open,
    hide,
    buttonProps: { ref: buttonRef, popoverTarget: popoverId, onClick: position },
    popoverProps: {
      ref: popoverRef,
      id: popoverId,
      popover: 'auto' as const,
      onBeforeToggle: (event: ToggleEvent<HTMLDivElement>) => setOpen(event.newState === 'open'),
    },
  }
}
