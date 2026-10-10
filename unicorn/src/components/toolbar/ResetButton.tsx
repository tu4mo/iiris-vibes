import { ResetIcon } from '../icons'
import { ToolbarButton } from './ToolbarButton'

export function ResetButton({ onReset }: { onReset: () => void }) {
  function handleClick() {
    // There's no undo yet, so confirm before throwing the drawing away.
    if (window.confirm('Reset the drawing? Your changes will be lost.')) onReset()
  }

  return (
    <ToolbarButton label="Reset drawing" onClick={handleClick}>
      <ResetIcon />
    </ToolbarButton>
  )
}
