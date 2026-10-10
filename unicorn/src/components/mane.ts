import type { CSSProperties } from 'react'
import { cssColor, hardStripes, type TailwindColor } from '../drawing/colors'

// The unicorn's mane as hard-edged bands: the visual signature of the app's panels.
const MANE_COLORS: TailwindColor[] = ['rose-400', 'amber-300', 'green-300', 'sky-300', 'violet-400']

// Pair with `border-4 border-transparent rounded-2xl`: the padding box is filled
// with indigo and the rainbow shows through the transparent border.
export const maneBorderStyle: CSSProperties = {
  background: `linear-gradient(${cssColor('indigo-950')}, ${cssColor('indigo-950')}) padding-box, ${hardStripes('to bottom', MANE_COLORS)} border-box`,
}

// The same bands side by side, exposed as --divider for dividers between groups.
export const maneDividerStyle = { '--divider': hardStripes('to right', MANE_COLORS) } as CSSProperties

// The bands top to bottom as a border image, for a bold edge on one side, such as `border-r-4`.
export const maneEdgeStyle: CSSProperties = {
  borderImage: `${hardStripes('to bottom', MANE_COLORS)} 1`,
}
