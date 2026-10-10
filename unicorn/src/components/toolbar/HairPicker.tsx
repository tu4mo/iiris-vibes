import type { Drawing } from '../../drawing/types'
import {
  HAIR_LAYER_ID,
  HAIR_STYLES,
  applyHairStyle,
  type HairStyle,
} from '../../presets/hairStyles'
import { PixelArt } from '../PixelArt'
import { ToolbarButton } from './ToolbarButton'
import { DrawingPreview, PopoverOption, ToolbarPopover } from './ToolbarPopover'
import { useAnchoredPopover } from './useAnchoredPopover'

type HairPickerProps = {
  drawing: Drawing
  value: HairStyle
  onChange: (style: HairStyle) => void
}

export function HairPicker({ drawing, value, onChange }: HairPickerProps) {
  const { hide, buttonProps, popoverProps } = useAnchoredPopover()

  function select(style: HairStyle) {
    onChange(style)
    hide()
  }

  return (
    <>
      <ToolbarButton label={`Hair colors: ${value.name}`} {...buttonProps}>
        <PixelArt
          drawing={drawing}
          highlightLayerId={HAIR_LAYER_ID}
          className="size-12 rounded-md bg-white/10"
        />
      </ToolbarButton>

      <ToolbarPopover popoverProps={popoverProps} label="Hair colors">
        <div className="flex flex-col gap-0.5">
          {HAIR_STYLES.map((style) => (
            <PopoverOption
              key={style.id}
              selected={style.id === value.id}
              onClick={() => select(style)}
            >
              <DrawingPreview drawing={applyHairStyle(drawing, style)} />
              {style.name}
            </PopoverOption>
          ))}
        </div>
      </ToolbarPopover>
    </>
  )
}
