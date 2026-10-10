import { useEffect, useRef, useState } from 'react'
import type { TailwindColor } from '../drawing/colors'
import type { Cell } from '../drawing/grid'
import { colorAt } from '../drawing/layers'
import type { Tool } from '../drawing/paint'
import type { useDrawing } from '../hooks/useDrawing'
import { currentHairStyle } from '../presets/hairStyles'
import { Canvas } from './canvas/Canvas'
import { EraserIcon, PencilIcon, PipetteIcon, PlayIcon } from './icons'
import { maneBorderStyle } from './mane'
import { ColorPalette } from './toolbar/ColorPalette'
import { HairPicker } from './toolbar/HairPicker'
import { ResetButton } from './toolbar/ResetButton'
import { Toolbar, ToolbarGroup } from './toolbar/Toolbar'
import { ToolbarButton } from './toolbar/ToolbarButton'

type EditorProps = {
  open: boolean
  onClose: () => void
} & ReturnType<typeof useDrawing>

// The unicorn editor, opened as a modal dialog on top of the game. It stays mounted while
// closed so the chosen tool and color are kept between visits.
export function Editor({ open, onClose, drawing, paint, reset, setHairStyle }: EditorProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [color, setColor] = useState<TailwindColor>('violet-600')
  const [tool, setTool] = useState<Tool>('draw')

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  const hairStyle = currentHairStyle(drawing)

  // Choosing a color means drawing with it next, whatever tool was active.
  function chooseColor(next: TailwindColor) {
    setColor(next)
    setTool('draw')
  }

  // Take the visible color under the cell.
  function pickColor(cell: Cell) {
    const picked = colorAt(drawing, cell)
    if (picked) chooseColor(picked)
  }

  return (
    // Esc closes the dialog natively; onClose keeps the open state in sync.
    <dialog
      ref={dialogRef}
      aria-label="Unicorn editor"
      className="m-auto h-[calc(100dvh-2rem)] p-0 max-h-none w-[calc(100vw-2rem)] max-w-none overflow-hidden rounded-3xl border-4 border-transparent text-sm text-sky-100 antialiased backdrop:bg-indigo-950/50"
      style={maneBorderStyle}
      onClose={onClose}
    >
      <div className="grid size-full grid-cols-[auto_1fr] bg-pixel-grid">
        {/* The toolbar and the palette, as two columns. */}
        <div className="flex min-h-0">
          <Toolbar>
            <ToolbarGroup label="Drawing">
              <ToolbarButton label="Draw" active={tool === 'draw'} onClick={() => setTool('draw')}>
                <PencilIcon />
              </ToolbarButton>
              <ToolbarButton
                label="Erase"
                active={tool === 'erase'}
                onClick={() => setTool('erase')}
              >
                <EraserIcon />
              </ToolbarButton>
              <ToolbarButton
                label="Pick color"
                active={tool === 'pick'}
                onClick={() => setTool('pick')}
              >
                <PipetteIcon />
              </ToolbarButton>
            </ToolbarGroup>

            {hairStyle && (
              <ToolbarGroup label="Presets">
                <HairPicker drawing={drawing} value={hairStyle} onChange={setHairStyle} />
              </ToolbarGroup>
            )}

            <ToolbarGroup label="Actions" end>
              <ToolbarButton label="Back to the game" onClick={onClose}>
                <PlayIcon />
              </ToolbarButton>
              <ResetButton onReset={reset} />
            </ToolbarGroup>
          </Toolbar>
          <ColorPalette value={color} onChange={chooseColor} />
        </div>
        <Canvas
          drawing={drawing}
          onPaint={(cells) => tool !== 'pick' && paint(cells, tool, color)}
          onPick={tool === 'pick' ? pickColor : undefined}
        />
      </div>
    </dialog>
  )
}
